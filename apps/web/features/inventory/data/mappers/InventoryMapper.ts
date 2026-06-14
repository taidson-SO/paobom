import {
  InventoryBalance,
  InventoryBalanceProps,
  StockMovement,
  StockMovementProps,
} from "@paobom/domain";

import {
  InventoryBalanceDTO,
  StockMovementDTO,
} from "@/features/inventory/data/dto/InventoryDTO";

export class InventoryMapper {
  static balanceToDTO(entity: InventoryBalance): InventoryBalanceDTO {
    const balance = entity.toJSON();

    return {
      average_cost: balance.averageCost,
      minimum_stock: balance.minimumStock,
      product_id: balance.productId,
      quantity: balance.quantity,
    };
  }

  static balanceToEntity(dto: InventoryBalanceDTO) {
    const props: InventoryBalanceProps = {
      averageCost: dto.average_cost,
      minimumStock: dto.minimum_stock,
      productId: dto.product_id,
      quantity: dto.quantity,
    };

    return new InventoryBalance(props);
  }

  static movementToDTO(entity: StockMovement): StockMovementDTO {
    const movement = entity.toJSON();

    return {
      id: movement.id,
      occurred_at: movement.occurredAt.toISOString(),
      origin: movement.origin,
      product_id: movement.productId,
      quantity: movement.quantity,
      reason: movement.reason,
      reference_id: movement.referenceId,
      type: movement.type,
      unit_cost: movement.unitCost,
    };
  }

  static movementToEntity(dto: StockMovementDTO) {
    const props: StockMovementProps = {
      id: dto.id,
      occurredAt: new Date(dto.occurred_at),
      origin: dto.origin,
      productId: dto.product_id,
      quantity: dto.quantity,
      reason: dto.reason,
      referenceId: dto.reference_id,
      type: dto.type,
      unitCost: dto.unit_cost,
    };

    return new StockMovement(props);
  }
}
