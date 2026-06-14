import { CustomerRepository } from "./customer";
import { ProductRepository } from "./product";

export type SaleStatus = "open" | "paid" | "cancelled";

export type PaymentMethod = "cash" | "card" | "pix" | "invoice";

export type SaleItemProps = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type SaleProps = {
  id: string;
  customerId: string | null;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  items: SaleItemProps[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
};

export type CreateSaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreateSaleInput = {
  customerId?: string | null;
  paymentMethod: PaymentMethod;
  items: CreateSaleItemInput[];
  notes: string;
};

export class Sale {
  constructor(private props: SaleProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get customerId() {
    return this.props.customerId;
  }

  get status() {
    return this.props.status;
  }

  get paymentMethod() {
    return this.props.paymentMethod;
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

  get paidAt() {
    return this.props.paidAt;
  }

  get total() {
    return this.props.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  }

  get totalCost() {
    return this.props.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );
  }

  get grossMargin() {
    return this.total - this.totalCost;
  }

  pay() {
    if (this.props.status === "cancelled") {
      throw new Error("Venda cancelada nao pode ser paga");
    }

    if (this.props.status === "paid") {
      throw new Error("Venda ja foi paga");
    }

    this.props = {
      ...this.props,
      paidAt: new Date(),
      status: "paid",
      updatedAt: new Date(),
    };
  }

  cancel() {
    if (this.props.status === "paid") {
      throw new Error("Venda paga nao pode ser cancelada");
    }

    this.props = {
      ...this.props,
      status: "cancelled",
      updatedAt: new Date(),
    };
  }

  toJSON(): SaleProps {
    return {
      ...this.props,
      items: this.items,
    };
  }

  private assertValid() {
    if (this.props.items.length === 0) {
      throw new Error("Venda deve possuir pelo menos um item");
    }

    this.props.items.forEach((item) => {
      if (!item.productId) {
        throw new Error("Produto do item deve ser informado");
      }

      if (item.quantity <= 0) {
        throw new Error("Quantidade do item deve ser maior que zero");
      }

      if (item.unitPrice < 0 || item.unitCost < 0) {
        throw new Error("Valores do item nao podem ser negativos");
      }
    });
  }
}

export interface SaleRepository {
  cancel(id: string): Promise<Sale>;
  create(sale: Sale): Promise<Sale>;
  findAll(): Promise<Sale[]>;
  findById(id: string): Promise<Sale | null>;
  pay(id: string): Promise<Sale>;
}

export interface SaleInventoryGateway {
  registerSale(sale: Sale): Promise<void>;
}

export interface SaleFinanceGateway {
  registerReceivable(sale: Sale): Promise<void>;
}

export class ListSalesUseCase {
  constructor(private readonly repository: SaleRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreateSaleUseCase {
  constructor(
    private readonly repository: SaleRepository,
    private readonly products: ProductRepository,
    private readonly customers: CustomerRepository,
    private readonly inventory: SaleInventoryGateway,
    private readonly finance: SaleFinanceGateway,
  ) {}

  async execute(input: CreateSaleInput) {
    if (input.customerId) {
      const customer = await this.customers.findById(input.customerId);

      if (!customer || !customer.active) {
        throw new Error("Cliente ativo deve ser informado para a venda");
      }
    }

    const items: SaleItemProps[] = [];

    for (const item of input.items) {
      const product = await this.products.findById(item.productId);

      if (!product || !product.active) {
        throw new Error("Todos os itens devem usar produtos ativos");
      }

      items.push({
        id: crypto.randomUUID(),
        productId: item.productId,
        quantity: item.quantity,
        unitCost: product.purchasePrice,
        unitPrice: item.unitPrice,
      });
    }

    const sale = new Sale({
      createdAt: new Date(),
      customerId: input.customerId ?? null,
      id: crypto.randomUUID(),
      items,
      notes: input.notes,
      paidAt: null,
      paymentMethod: input.paymentMethod,
      status: "open",
      updatedAt: new Date(),
    });
    const createdSale = await this.repository.create(sale);

    await this.inventory.registerSale(createdSale);

    if (createdSale.paymentMethod !== "invoice") {
      const paidSale = await this.repository.pay(createdSale.id);

      await this.finance.registerReceivable(paidSale);

      return paidSale;
    }

    await this.finance.registerReceivable(createdSale);

    return createdSale;
  }
}

export class PaySaleUseCase {
  constructor(private readonly repository: SaleRepository) {}

  async execute(id: string) {
    if (!id) {
      throw new Error("Venda nao informada");
    }

    return this.repository.pay(id);
  }
}

export class CancelSaleUseCase {
  constructor(private readonly repository: SaleRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Venda nao informada");
    }

    return this.repository.cancel(id);
  }
}
