import { ProductRepository } from "./product";
import { SupplierRepository } from "./supplier";

export type PurchaseStatus = "draft" | "ordered" | "received" | "cancelled";

export type PurchaseItemProps = {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
};

export type PurchaseProps = {
  id: string;
  supplierId: string;
  expectedDate: Date;
  status: PurchaseStatus;
  items: PurchaseItemProps[];
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

  receive() {
    if (this.props.status === "cancelled") {
      throw new Error("Compra cancelada nao pode ser recebida");
    }

    if (this.props.status === "received") {
      throw new Error("Compra ja foi recebida");
    }

    this.props = {
      ...this.props,
      receivedAt: new Date(),
      status: "received",
      updatedAt: new Date(),
    };
  }

  cancel() {
    if (this.props.status === "received") {
      throw new Error("Compra recebida nao pode ser cancelada");
    }

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

      if (item.unitCost < 0) {
        throw new Error("Custo unitario nao pode ser negativo");
      }
    });
  }
}

export interface PurchaseRepository {
  cancel(id: string): Promise<Purchase>;
  create(input: CreatePurchaseInput): Promise<Purchase>;
  findAll(): Promise<Purchase[]>;
  findById(id: string): Promise<Purchase | null>;
  receive(id: string): Promise<Purchase>;
}

export interface PurchaseInventoryGateway {
  registerReceipt(purchase: Purchase): Promise<void>;
}

export class ListPurchasesUseCase {
  constructor(private readonly repository: PurchaseRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreatePurchaseUseCase {
  constructor(
    private readonly repository: PurchaseRepository,
    private readonly products: ProductRepository,
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute(input: CreatePurchaseInput) {
    const supplier = await this.suppliers.findById(input.supplierId);

    if (!supplier || !supplier.active) {
      throw new Error("Fornecedor ativo deve ser informado para a compra");
    }

    for (const item of input.items) {
      const product = await this.products.findById(item.productId);

      if (!product || !product.active) {
        throw new Error("Todos os itens devem usar produtos ativos");
      }
    }

    return this.repository.create(input);
  }
}

export class ReceivePurchaseUseCase {
  constructor(
    private readonly repository: PurchaseRepository,
    private readonly inventory: PurchaseInventoryGateway,
  ) {}

  async execute(id: string) {
    if (!id) {
      throw new Error("Compra nao informada");
    }

    const purchase = await this.repository.receive(id);

    await this.inventory.registerReceipt(purchase);

    return purchase;
  }
}

export class CancelPurchaseUseCase {
  constructor(private readonly repository: PurchaseRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Compra nao informada");
    }

    return this.repository.cancel(id);
  }
}
