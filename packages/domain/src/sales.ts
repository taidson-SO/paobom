import { CustomerRepository } from "./customer";
import { InventoryRepository } from "./inventory";
import { ProductRepository } from "./product";

export type SaleStatus = "open" | "paid" | "cancelled";

export type PaymentMethod = "cash" | "card" | "pix" | "invoice";

export type SalePaymentProps = {
  id: string;
  method: PaymentMethod;
  amount: number;
  referenceCode: string | null;
  cardBrand: string | null;
  installments: number;
};

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
  payments?: SalePaymentProps[];
  items: SaleItemProps[];
  discountAmount: number;
  discountAuthorizedBy: string | null;
  discountReason: string | null;
  oversellApprovedBy: string | null;
  oversellJustification: string | null;
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
  discountAmount?: number;
  discountAuthorizedBy?: string | null;
  discountReason?: string | null;
  paymentMethod: PaymentMethod;
  payments?: Array<{
    amount: number;
    cardBrand?: string | null;
    installments?: number;
    method: PaymentMethod;
    referenceCode?: string | null;
  }>;
  items: CreateSaleItemInput[];
  notes: string;
  oversellApprovedBy?: string | null;
  oversellJustification?: string | null;
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

  get payments() {
    return [...(this.props.payments ?? [])];
  }

  get items() {
    return [...this.props.items];
  }

  get notes() {
    return this.props.notes;
  }

  get discountAmount() {
    return this.props.discountAmount;
  }

  get discountAuthorizedBy() {
    return this.props.discountAuthorizedBy;
  }

  get discountReason() {
    return this.props.discountReason;
  }

  get oversellApprovedBy() {
    return this.props.oversellApprovedBy;
  }

  get oversellJustification() {
    return this.props.oversellJustification;
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

  get subtotal() {
    return this.props.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  }

  get total() {
    return Math.max(0, this.subtotal - this.props.discountAmount);
  }

  get paidAmount() {
    return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  get discountRate() {
    return this.subtotal > 0 ? this.props.discountAmount / this.subtotal : 0;
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
    if (this.props.status === "cancelled") {
      throw new Error("Venda ja foi cancelada");
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
      payments: this.payments,
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

      if (item.unitPrice <= 0 || item.unitCost < 0) {
        throw new Error("Preco deve ser maior que zero e custo nao pode ser negativo");
      }
    });

    if (this.props.discountAmount < 0) {
      throw new Error("Desconto nao pode ser negativo");
    }

    if (this.props.discountAmount > this.subtotal) {
      throw new Error("Desconto nao pode superar o subtotal da venda");
    }

    if (this.discountRate > 0.1) {
      if (!this.props.discountAuthorizedBy?.trim()) {
        throw new Error("Desconto acima do limite exige autorizacao");
      }

      if (!this.props.discountReason?.trim()) {
        throw new Error("Desconto acima do limite exige justificativa");
      }
    }

    this.payments.forEach((payment) => {
      if (payment.amount <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero");
      }

      if (payment.installments <= 0) {
        throw new Error("Parcelas do pagamento devem ser maiores que zero");
      }
    });

    if (this.payments.length > 0 && Math.abs(this.paidAmount - this.total) > 0.01) {
      throw new Error("Pagamentos da venda devem fechar o total");
    }
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
  reverseSale(sale: Sale): Promise<void>;
  registerSale(sale: Sale): Promise<void>;
}

export interface SaleFinanceGateway {
  cancelReceivable(sale: Sale): Promise<void>;
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
    private readonly inventoryRepository: InventoryRepository,
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

    const balances = await this.inventoryRepository.findBalances();
    const items: SaleItemProps[] = [];

    for (const item of input.items) {
      const product = await this.products.findById(item.productId);

      if (!product || !product.isSellable()) {
        throw new Error("Todos os itens devem usar produtos vendaveis ativos");
      }

      items.push({
        id: crypto.randomUUID(),
        productId: item.productId,
        quantity: item.quantity,
        unitCost:
          balances.find((balance) => balance.productId === item.productId)
            ?.averageCost ?? product.purchasePrice,
        unitPrice: item.unitPrice,
      });
    }

    this.assertInventoryAvailability(items, input, balances);

    const sale = new Sale({
      createdAt: new Date(),
      customerId: input.customerId ?? null,
      discountAmount: input.discountAmount ?? 0,
      discountAuthorizedBy: input.discountAuthorizedBy ?? null,
      discountReason: input.discountReason ?? null,
      id: crypto.randomUUID(),
      items,
      notes: input.notes,
      oversellApprovedBy: input.oversellApprovedBy ?? null,
      oversellJustification: input.oversellJustification ?? null,
      paidAt: null,
      paymentMethod: input.paymentMethod,
      payments: input.payments?.map((payment) => ({
        amount: payment.amount,
        cardBrand: payment.cardBrand ?? null,
        id: crypto.randomUUID(),
        installments: payment.installments ?? 1,
        method: payment.method,
        referenceCode: payment.referenceCode ?? null,
      })),
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

  private assertInventoryAvailability(
    items: SaleItemProps[],
    input: CreateSaleInput,
    balances: Awaited<ReturnType<InventoryRepository["findBalances"]>>,
  ) {
    const insufficientItems = items.filter((item) => {
      const balance = balances.find((entry) => entry.productId === item.productId);

      return !balance || balance.quantity < item.quantity;
    });

    if (insufficientItems.length === 0) {
      return;
    }

    if (!input.oversellApprovedBy?.trim()) {
      throw new Error("Venda acima do estoque exige responsavel");
    }

    if (!input.oversellJustification?.trim()) {
      throw new Error("Venda acima do estoque exige justificativa");
    }
  }
}

export class PaySaleUseCase {
  constructor(
    private readonly repository: SaleRepository,
    private readonly finance: SaleFinanceGateway,
  ) {}

  async execute(id: string) {
    if (!id) {
      throw new Error("Venda nao informada");
    }

    const sale = await this.repository.pay(id);

    await this.finance.registerReceivable(sale);

    return sale;
  }
}

export class CancelSaleUseCase {
  constructor(
    private readonly repository: SaleRepository,
    private readonly finance: SaleFinanceGateway,
    private readonly inventory: SaleInventoryGateway,
  ) {}

  async execute(id: string) {
    if (!id) {
      throw new Error("Venda nao informada");
    }

    const sale = await this.repository.cancel(id);

    await this.inventory.reverseSale(sale);
    await this.finance.cancelReceivable(sale);

    return sale;
  }
}
