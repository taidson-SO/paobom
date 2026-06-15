import { ProductRepository } from "./product";

export type StockMovementType =
  | "purchase_in"
  | "purchase_reversal"
  | "production_out"
  | "production_in"
  | "production_reversal"
  | "sale_out"
  | "sale_reversal"
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
  lotId?: string | null;
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

export type InventoryLotStatus = "active" | "depleted" | "expired";

export type InventoryLotProps = {
  id: string;
  productId: string;
  lotCode: string;
  quantity: number;
  unitCost: number;
  expirationDate: Date | null;
  supplierId: string | null;
  purchaseId: string | null;
  receivedAt: Date;
  status: InventoryLotStatus;
};

export type PhysicalInventoryCountProps = {
  id: string;
  productId: string;
  expectedQuantity: number;
  countedQuantity: number;
  divergenceQuantity: number;
  reason: string | null;
  countedBy: string;
  countedAt: Date;
};

export type RegisterStockMovementInput = {
  productId: string;
  type: StockMovementType;
  origin?: StockMovementOrigin;
  lotCode?: string | null;
  lotId?: string | null;
  expirationDate?: Date | null;
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

export type RegisterPhysicalInventoryCountInput = {
  productId: string;
  countedQuantity: number;
  countedBy: string;
  reason?: string | null;
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

  get lotId() {
    return this.props.lotId;
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
      this.props.type === "production_reversal" ||
      this.props.type === "sale_reversal" ||
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
    type === "production_reversal" ||
    type === "sale_out" ||
    type === "sale_reversal"
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

export class InventoryLot {
  constructor(private readonly props: InventoryLotProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get productId() {
    return this.props.productId;
  }

  get lotCode() {
    return this.props.lotCode;
  }

  get quantity() {
    return this.props.quantity;
  }

  get unitCost() {
    return this.props.unitCost;
  }

  get expirationDate() {
    return this.props.expirationDate;
  }

  get supplierId() {
    return this.props.supplierId;
  }

  get purchaseId() {
    return this.props.purchaseId;
  }

  get receivedAt() {
    return this.props.receivedAt;
  }

  get status() {
    return this.props.status;
  }

  get isExpired() {
    return Boolean(
      this.props.expirationDate && this.props.expirationDate < new Date(),
    );
  }

  get estimatedValue() {
    return this.props.quantity * this.props.unitCost;
  }

  toJSON(): InventoryLotProps {
    return { ...this.props };
  }

  private assertValid() {
    if (!this.props.productId) {
      throw new Error("Produto do lote deve ser informado");
    }

    if (this.props.lotCode.trim().length < 2) {
      throw new Error("Codigo do lote deve ser informado");
    }

    if (this.props.quantity < 0) {
      throw new Error("Quantidade do lote nao pode ser negativa");
    }

    if (this.props.unitCost < 0) {
      throw new Error("Custo do lote nao pode ser negativo");
    }
  }
}

export class PhysicalInventoryCount {
  constructor(private readonly props: PhysicalInventoryCountProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get productId() {
    return this.props.productId;
  }

  get expectedQuantity() {
    return this.props.expectedQuantity;
  }

  get countedQuantity() {
    return this.props.countedQuantity;
  }

  get divergenceQuantity() {
    return this.props.divergenceQuantity;
  }

  get reason() {
    return this.props.reason;
  }

  get countedBy() {
    return this.props.countedBy;
  }

  get countedAt() {
    return this.props.countedAt;
  }

  get hasDivergence() {
    return this.props.divergenceQuantity !== 0;
  }

  toJSON(): PhysicalInventoryCountProps {
    return { ...this.props };
  }

  private assertValid() {
    if (!this.props.productId) {
      throw new Error("Produto da contagem deve ser informado");
    }

    if (this.props.countedQuantity < 0) {
      throw new Error("Quantidade contada nao pode ser negativa");
    }

    if (!this.props.countedBy.trim()) {
      throw new Error("Responsavel pela contagem deve ser informado");
    }

    if (this.hasDivergence && !this.props.reason?.trim()) {
      throw new Error("Divergencia de inventario exige justificativa");
    }
  }
}

export interface InventoryRepository {
  findBalances(): Promise<InventoryBalance[]>;
  findLots(): Promise<InventoryLot[]>;
  findMovements(): Promise<StockMovement[]>;
  findPhysicalCounts(): Promise<PhysicalInventoryCount[]>;
  registerPhysicalCount(
    input: RegisterPhysicalInventoryCountInput,
  ): Promise<PhysicalInventoryCount>;
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

export class ListInventoryLotsUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  execute() {
    return this.repository.findLots();
  }
}

export class ListPhysicalInventoryCountsUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  execute() {
    return this.repository.findPhysicalCounts();
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

export class RegisterPhysicalInventoryCountUseCase {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: RegisterPhysicalInventoryCountInput) {
    const product = await this.products.findById(input.productId);

    if (!product || !product.active) {
      throw new Error("Produto ativo deve ser informado para inventario fisico");
    }

    return this.repository.registerPhysicalCount(input);
  }
}
