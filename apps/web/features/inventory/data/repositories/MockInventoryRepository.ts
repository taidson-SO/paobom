import {
  InventoryBalance,
  InventoryRepository,
  RegisterStockMovementInput,
  StockMovement,
} from "@paobom/domain";

import { AppEvents, EventBus } from "@/core/infrastructure/events/event-bus";
import {
  InventoryBalanceDTO,
  StockMovementDTO,
} from "@/features/inventory/data/dto/InventoryDTO";
import { InventoryMapper } from "@/features/inventory/data/mappers/InventoryMapper";

const now = new Date().toISOString();

let balances: InventoryBalanceDTO[] = [
  {
    average_cost: 92,
    minimum_stock: 25,
    product_id: "prod-1",
    quantity: 18,
  },
  {
    average_cost: 0.22,
    minimum_stock: 100,
    product_id: "prod-2",
    quantity: 260,
  },
];

let movements: StockMovementDTO[] = [
  {
    id: "mov-1",
    occurred_at: now,
    origin: "opening_balance",
    product_id: "prod-1",
    quantity: 18,
    reason: "Saldo inicial",
    reference_id: null,
    type: "adjustment",
    unit_cost: 92,
  },
  {
    id: "mov-2",
    occurred_at: now,
    origin: "opening_balance",
    product_id: "prod-2",
    quantity: 260,
    reason: "Saldo inicial",
    reference_id: null,
    type: "adjustment",
    unit_cost: 0.22,
  },
];

let subscribed = false;

export class MockInventoryRepository implements InventoryRepository {
  constructor(events: EventBus<AppEvents>) {
    if (!subscribed) {
      events.on("inventory:movement-requested", (payload) => {
        void this.registerMovement(payload);
      });
      subscribed = true;
    }
  }

  async findBalances() {
    return balances.map(InventoryMapper.balanceToEntity);
  }

  async findMovements() {
    return movements
      .map(InventoryMapper.movementToEntity)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async registerMovement(input: RegisterStockMovementInput) {
    const movement = new StockMovement({
      id: crypto.randomUUID(),
      occurredAt: input.occurredAt ?? new Date(),
      origin: input.origin ?? getOrigin(input.type),
      productId: input.productId,
      quantity: input.quantity,
      reason: input.reason,
      referenceId: input.referenceId ?? null,
      type: input.type,
      unitCost: input.unitCost,
    });

    movements = [InventoryMapper.movementToDTO(movement), ...movements];
    balances = upsertBalance(movement, balances);

    return movement;
  }
}

function upsertBalance(
  movement: StockMovement,
  currentBalances: InventoryBalanceDTO[],
) {
  const current = currentBalances.find(
    (balance) => balance.product_id === movement.productId,
  );
  const direction = getDirection(movement);
  const nextQuantity = (current?.quantity ?? 0) + direction * movement.quantity;

  if (nextQuantity < 0) {
    throw new Error("Movimentacao deixaria o estoque negativo");
  }

  const nextBalance = new InventoryBalance({
    averageCost: calculateAverageCost(movement, current),
    minimumStock: current?.minimum_stock ?? 0,
    productId: movement.productId,
    quantity: Math.max(0, nextQuantity),
  });
  const dto = InventoryMapper.balanceToDTO(nextBalance);

  if (!current) {
    return [dto, ...currentBalances];
  }

  return currentBalances.map((balance) =>
    balance.product_id === movement.productId ? dto : balance,
  );
}

function getDirection(movement: StockMovement) {
  return movement.isInbound ? 1 : -1;
}

function calculateAverageCost(
  movement: StockMovement,
  current?: InventoryBalanceDTO,
) {
  if (!movement.isInbound) {
    return current?.average_cost ?? movement.unitCost;
  }

  const currentQuantity = current?.quantity ?? 0;
  const currentAverageCost = current?.average_cost ?? 0;
  const currentValue = currentQuantity * currentAverageCost;
  const incomingValue = movement.quantity * movement.unitCost;
  const nextQuantity = currentQuantity + movement.quantity;

  if (nextQuantity <= 0) {
    return movement.unitCost;
  }

  return (currentValue + incomingValue) / nextQuantity;
}

function getOrigin(type: RegisterStockMovementInput["type"]) {
  const origins = {
    adjustment: "manual_adjustment",
    loss: "loss",
    production_in: "production",
    production_out: "production",
    production_reversal: "production",
    purchase_in: "purchase",
    purchase_reversal: "purchase",
    sale_out: "sale",
  } as const;

  return origins[type];
}
