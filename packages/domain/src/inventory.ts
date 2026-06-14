import { ProductRepository } from "./product";

export type StockMovementType =
  | "purchase_in"
  | "purchase_reversal"
  | "production_out"
  | "production_in"
  | "sale_out"
  | "loss"
  | "adjustment";

export type StockMovementOrigin =
  | "opening_balance"
  | "purchase"
  | "production"
  | "sale"
  | "loss"
  | "manual_adjustment"
  | "return";

export type StockMovementProps = {
  id: string;
  productId: string;
  type: StockMovementType;
  origin: StockMovementOrigin;
  quantity: number;
  unitCost: number;
  reason: string;
  referenceId: string | null;
  occurredAt: Date;
};

export type InventoryBalanceProps = {
  productId: string;
  quantity: number;
  averageCost: number;
  minimumStock: number;
};

export type RegisterStockMovementInput = {
  productId: string;
  type: StockMovementType;
  origin?: StockMovementOrigin;
  quantity: number;
  unitCost: number;
  reason: string;
  referenceId?: string | null;
  occurredAt?: Date;
};

export type RegisterLossInput = {
  productId: string;
  quantity: number;
  reason: string;
};

export type RegisterAdjustmentInput = {
  productId: string;
  quantity: number;
  reason: string;
};

export class StockMovement {
  constructor(private readonly props: StockMovementProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get productId() {
    return this.props.productId;
  }

  get type() {
    return this.props.type;
  }

  get origin() {
    return this.props.origin;
  }

  get quantity() {
    return this.props.quantity;
  }

  get unitCost() {
    return this.props.unitCost;
  }

  get reason() {
    return this.props.reason;
  }

  get referenceId() {
    return this.props.referenceId;
  }

  get occurredAt() {
    return this.props.occurredAt;
  }

  get isInbound() {
    return (
      this.props.type === "purchase_in" ||
      this.props.type === "production_in" ||
      this.props.type === "adjustment"
    );
  }

  get isOutbound() {
    return !this.isInbound;
  }

  toJSON(): StockMovementProps {
    return { ...this.props };
  }

  private assertValid() {
    if (!this.props.productId) {
      throw new Error("Produto da movimentacao deve ser informado");
    }

    if (this.props.quantity <= 0) {
      throw new Error("Quantidade da movimentacao deve ser maior que zero");
    }

    if (this.props.unitCost < 0) {
      throw new Error("Custo unitario nao pode ser negativo");
    }

    if (this.props.reason.trim().length < 2) {
      throw new Error("Movimentacao de estoque deve possuir justificativa");
    }

    if (requiresReference(this.props.type) && !this.props.referenceId) {
      throw new Error("Movimentacao de estoque deve possuir referencia de origem");
    }
  }
}

function requiresReference(type: StockMovementType) {
  return (
    type === "purchase_in" ||
    type === "purchase_reversal" ||
    type === "production_in" ||
    type === "production_out" ||
    type === "sale_out"
  );
}

export class InventoryBalance {
  constructor(private readonly props: InventoryBalanceProps) {}

  get productId() {
    return this.props.productId;
  }

  get quantity() {
    return this.props.quantity;
  }

  get averageCost() {
    return this.props.averageCost;
  }

  get minimumStock() {
    return this.props.minimumStock;
  }

  get isBelowMinimum() {
    return this.props.quantity < this.props.minimumStock;
  }

  get estimatedValue() {
    return this.props.quantity * this.props.averageCost;
  }

  toJSON(): InventoryBalanceProps {
    return { ...this.props };
  }
}

export interface InventoryRepository {
  findBalances(): Promise<InventoryBalance[]>;
  findMovements(): Promise<StockMovement[]>;
  registerMovement(input: RegisterStockMovementInput): Promise<StockMovement>;
}

export class ListInventoryBalancesUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  execute() {
    return this.repository.findBalances();
  }
}

export class ListStockMovementsUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  execute() {
    return this.repository.findMovements();
  }
}

export class RegisterLossUseCase {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: RegisterLossInput) {
    const product = await this.products.findById(input.productId);

    if (!product || !product.active) {
      throw new Error("Produto ativo deve ser informado para registrar perda");
    }

    return this.repository.registerMovement({
      productId: input.productId,
      quantity: input.quantity,
      reason: input.reason,
      type: "loss",
      unitCost: product.purchasePrice,
    });
  }
}

export class RegisterInventoryAdjustmentUseCase {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: RegisterAdjustmentInput) {
    const product = await this.products.findById(input.productId);

    if (!product || !product.active) {
      throw new Error("Produto ativo deve ser informado para ajuste");
    }

    return this.repository.registerMovement({
      productId: input.productId,
      quantity: input.quantity,
      reason: input.reason,
      type: "adjustment",
      unitCost: product.purchasePrice,
    });
  }
}
