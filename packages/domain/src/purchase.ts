import { ProductRepository } from "./product";
import { SupplierRepository } from "./supplier";

export type PurchaseStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseItemProps = {
  id: string;
  productId: string;
  quantity: number;
  receivedQuantity?: number;
  unitCost: number;
};

export type PurchaseHistoryAction =
  | "created"
  | "approved"
  | "received"
  | "cancelled";

export type PurchaseHistoryEntryProps = {
  id: string;
  action: PurchaseHistoryAction;
  description: string;
  actor: string;
  occurredAt: Date;
};

export type PayableStatus = "open" | "partial" | "paid" | "cancelled";

export type PurchasePayableProps = {
  id: string;
  purchaseId: string;
  supplierId: string;
  amount: number;
  paidAmount: number;
  status: PayableStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PurchaseProps = {
  id: string;
  supplierId: string;
  expectedDate: Date;
  status: PurchaseStatus;
  items: PurchaseItemProps[];
  approvedAt?: Date | null;
  approvedBy?: string | null;
  history?: PurchaseHistoryEntryProps[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  receivedAt: Date | null;
};

export type CreatePurchaseItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export type CreatePurchaseInput = {
  supplierId: string;
  expectedDate: Date;
  items: CreatePurchaseItemInput[];
  notes: string;
};

export type ReceivePurchaseItemInput = {
  productId: string;
  receivedQuantity: number;
  lotCode?: string | null;
  expirationDate?: Date | null;
};

export type ReceivePurchaseInput = {
  purchaseId: string;
  items?: ReceivePurchaseItemInput[];
  receivedBy: string;
  divergenceReason?: string | null;
};

export type ApprovePurchaseInput = {
  approvedBy: string;
  purchaseId: string;
};

export class Purchase {
  constructor(private props: PurchaseProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get supplierId() {
    return this.props.supplierId;
  }

  get expectedDate() {
    return this.props.expectedDate;
  }

  get status() {
    return this.props.status;
  }

  get items() {
    return [...this.props.items];
  }

  get approvedAt() {
    return this.props.approvedAt ?? null;
  }

  get approvedBy() {
    return this.props.approvedBy ?? null;
  }

  get history() {
    return [...(this.props.history ?? [])];
  }

  get notes() {
    return this.props.notes;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get receivedAt() {
    return this.props.receivedAt;
  }

  get total() {
    return this.props.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );
  }

  get wasReceived() {
    return this.props.receivedAt !== null;
  }

  get receivedTotal() {
    return this.props.items.reduce(
      (sum, item) => sum + (item.receivedQuantity ?? 0) * item.unitCost,
      0,
    );
  }

  get hasDivergence() {
    return this.props.items.some(
      (item) => (item.receivedQuantity ?? 0) !== item.quantity,
    );
  }

  approve(approvedBy: string) {
    if (this.props.status === "cancelled") {
      throw new Error("Compra cancelada nao pode ser aprovada");
    }

    if (!approvedBy.trim()) {
      throw new Error("Responsavel pela aprovacao deve ser informado");
    }

    this.props = {
      ...this.props,
      approvedAt: new Date(),
      approvedBy,
      status: "approved",
      updatedAt: new Date(),
    };
  }

  receive(items?: ReceivePurchaseItemInput[], divergenceReason?: string | null) {
    if (this.props.status === "cancelled") {
      throw new Error("Compra cancelada nao pode ser recebida");
    }

    if (this.props.status === "received") {
      throw new Error("Compra ja foi recebida");
    }

    const receivedItems = this.props.items.map((item) => {
      const receivedItem = items?.find((entry) => entry.productId === item.productId);

      return {
        ...item,
        receivedQuantity: receivedItem?.receivedQuantity ?? item.quantity,
      };
    });
    const hasDivergence = receivedItems.some(
      (item) => (item.receivedQuantity ?? 0) !== item.quantity,
    );

    if (hasDivergence && !divergenceReason?.trim()) {
      throw new Error("Recebimento com divergencia exige justificativa");
    }

    const allReceived = receivedItems.every(
      (item) => (item.receivedQuantity ?? 0) >= item.quantity,
    );

    this.props = {
      ...this.props,
      items: receivedItems,
      receivedAt: new Date(),
      status: allReceived ? "received" : "partially_received",
      updatedAt: new Date(),
    };
  }

  cancel() {
    this.props = {
      ...this.props,
      status: "cancelled",
      updatedAt: new Date(),
    };
  }

  toJSON(): PurchaseProps {
    return {
      ...this.props,
      items: this.items,
    };
  }

  private assertValid() {
    if (!this.props.supplierId) {
      throw new Error("Fornecedor da compra deve ser informado");
    }

    if (this.props.items.length === 0) {
      throw new Error("Compra deve possuir pelo menos um item");
    }

    this.props.items.forEach((item) => {
      if (!item.productId) {
        throw new Error("Produto do item deve ser informado");
      }

      if (item.quantity <= 0) {
        throw new Error("Quantidade do item deve ser maior que zero");
      }

      if (item.unitCost <= 0) {
        throw new Error("Custo unitario deve ser maior que zero");
      }
    });
  }
}

export class PurchasePayable {
  constructor(private readonly props: PurchasePayableProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get purchaseId() {
    return this.props.purchaseId;
  }

  get supplierId() {
    return this.props.supplierId;
  }

  get amount() {
    return this.props.amount;
  }

  get paidAmount() {
    return this.props.paidAmount;
  }

  get status() {
    return this.props.status;
  }

  get dueDate() {
    return this.props.dueDate;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get openAmount() {
    return Math.max(0, this.props.amount - this.props.paidAmount);
  }

  toJSON(): PurchasePayableProps {
    return { ...this.props };
  }

  private assertValid() {
    if (!this.props.purchaseId) {
      throw new Error("Compra da conta a pagar deve ser informada");
    }

    if (!this.props.supplierId) {
      throw new Error("Fornecedor da conta a pagar deve ser informado");
    }

    if (this.props.amount <= 0) {
      throw new Error("Valor da conta a pagar deve ser maior que zero");
    }

    if (this.props.paidAmount < 0 || this.props.paidAmount > this.props.amount) {
      throw new Error("Valor pago da conta a pagar e invalido");
    }
  }
}

export interface PurchaseRepository {
  approve(input: ApprovePurchaseInput): Promise<Purchase>;
  cancel(id: string): Promise<Purchase>;
  create(input: CreatePurchaseInput): Promise<Purchase>;
  findAll(): Promise<Purchase[]>;
  findById(id: string): Promise<Purchase | null>;
  findPayables(): Promise<PurchasePayable[]>;
  receive(input: ReceivePurchaseInput): Promise<Purchase>;
}

export interface PurchaseInventoryGateway {
  reverseReceipt(purchase: Purchase): Promise<void>;
  registerReceipt(purchase: Purchase): Promise<void>;
}

export interface PurchaseFinanceGateway {
  cancelPayable(purchase: Purchase): Promise<void>;
  registerPayable(purchase: Purchase): Promise<void>;
}

export class ListPurchasesUseCase {
  constructor(private readonly repository: PurchaseRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class ListPurchasePayablesUseCase {
  constructor(private readonly repository: PurchaseRepository) {}

  execute() {
    return this.repository.findPayables();
  }
}

export class CreatePurchaseUseCase {
  constructor(
    private readonly repository: PurchaseRepository,
    private readonly products: ProductRepository,
    private readonly suppliers: SupplierRepository,
    private readonly finance?: PurchaseFinanceGateway,
  ) {}

  async execute(input: CreatePurchaseInput) {
    const supplier = await this.suppliers.findById(input.supplierId);

    if (!supplier || !supplier.active) {
      throw new Error("Fornecedor ativo deve ser informado para a compra");
    }

    for (const item of input.items) {
      const product = await this.products.findById(item.productId);

      if (!product || !product.isPurchasable()) {
        throw new Error("Todos os itens devem usar insumos ou itens compraveis ativos");
      }
    }

    const purchase = await this.repository.create(input);

    await this.finance?.registerPayable(purchase);

    return purchase;
  }
}

export class ApprovePurchaseUseCase {
  constructor(private readonly repository: PurchaseRepository) {}

  execute(input: ApprovePurchaseInput) {
    if (!input.purchaseId) {
      throw new Error("Compra nao informada");
    }

    return this.repository.approve(input);
  }
}

export class ReceivePurchaseUseCase {
  constructor(
    private readonly repository: PurchaseRepository,
    private readonly inventory: PurchaseInventoryGateway,
  ) {}

  async execute(input: string | ReceivePurchaseInput) {
    const receiveInput =
      typeof input === "string"
        ? { purchaseId: input, receivedBy: "Sistema" }
        : input;

    if (!receiveInput.purchaseId) {
      throw new Error("Compra nao informada");
    }

    const purchase = await this.repository.receive(receiveInput);

    await this.inventory.registerReceipt(purchase);

    return purchase;
  }
}

export class CancelPurchaseUseCase {
  constructor(
    private readonly repository: PurchaseRepository,
    private readonly finance?: PurchaseFinanceGateway,
    private readonly inventory?: PurchaseInventoryGateway,
  ) {}

  async execute(id: string) {
    if (!id) {
      throw new Error("Compra nao informada");
    }

    const purchase = await this.repository.cancel(id);

    await this.finance?.cancelPayable(purchase);

    if (purchase.wasReceived) {
      await this.inventory?.reverseReceipt(purchase);
    }

    return purchase;
  }
}
