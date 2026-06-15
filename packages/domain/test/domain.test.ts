import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ApprovePurchaseUseCase,
  AuditLog,
  CashEntry,
  CashRegister,
  CloseCashRegisterUseCase,
  CreateProductionOrderUseCase,
  CreatePurchaseUseCase,
  CreateRecipeUseCase,
  CreateSaleUseCase,
  Customer,
  type CustomerRepository,
  GetCashFlowSummaryUseCase,
  hasEveryPermission,
  hasPermission,
  InventoryBalance,
  type InventoryRepository,
  PhysicalInventoryCount,
  Product,
  type ProductRepository,
  ProductionOrder,
  type ProductionOrderRepository,
  Purchase,
  type PurchaseFinanceGateway,
  type PurchaseInventoryGateway,
  type PurchaseRepository,
  Recipe,
  type RecipeRepository,
  ReceivePurchaseUseCase,
  RegisterInventoryAdjustmentUseCase,
  RegisterLossUseCase,
  RegisterPhysicalInventoryCountUseCase,
  Sale,
  type SaleFinanceGateway,
  type SaleInventoryGateway,
  type SaleRepository,
  StockMovement,
  Supplier,
  type SupplierRepository,
  type CashFlowRepository,
  type CashRegisterRepository,
} from "../src";

const fixedDate = new Date("2026-06-14T10:00:00.000Z");

function product(overrides: Partial<ConstructorParameters<typeof Product>[0]> = {}) {
  return new Product({
    active: true,
    category: "Insumos",
    createdAt: fixedDate,
    id: "product-1",
    kind: "raw_material",
    minimumStock: 5,
    name: "Farinha de trigo",
    purchasePrice: 4,
    salePrice: 0,
    sku: "FAR-001",
    unit: "kg",
    updatedAt: fixedDate,
    ...overrides,
  });
}

function supplier(overrides: Partial<ConstructorParameters<typeof Supplier>[0]> = {}) {
  return new Supplier({
    active: true,
    contactName: "Ana",
    createdAt: fixedDate,
    document: "123456789",
    email: "ana@fornecedor.test",
    id: "supplier-1",
    name: "Fornecedor Central",
    phone: "81999990000",
    updatedAt: fixedDate,
    ...overrides,
  });
}

function customer(overrides: Partial<ConstructorParameters<typeof Customer>[0]> = {}) {
  return new Customer({
    active: true,
    createdAt: fixedDate,
    document: "123456789",
    email: "cliente@paobom.test",
    id: "customer-1",
    name: "Cliente Balcao",
    notes: "",
    phone: "81999990000",
    updatedAt: fixedDate,
    ...overrides,
  });
}

function recipe(overrides: Partial<ConstructorParameters<typeof Recipe>[0]> = {}) {
  return new Recipe({
    active: true,
    createdAt: fixedDate,
    id: "recipe-1",
    ingredients: [{ productId: "flour", quantity: 2 }],
    name: "Pao frances",
    outputProductId: "bread",
    updatedAt: fixedDate,
    version: 2,
    yieldQuantity: 10,
    ...overrides,
  });
}

function productionOrder(
  overrides: Partial<ConstructorParameters<typeof ProductionOrder>[0]> = {},
) {
  const baseRecipe = recipe();

  return new ProductionOrder({
    completedAt: null,
    createdAt: fixedDate,
    id: "production-1",
    ingredientConsumptions: [{ productId: "flour", quantity: 4, unitCost: 4 }],
    notes: "Producao matinal",
    outputProductId: baseRecipe.outputProductId,
    quantityProduced: 20,
    recipeId: baseRecipe.id,
    recipeSnapshot: baseRecipe.toSnapshot(),
    startedAt: null,
    status: "planned",
    ...overrides,
  });
}

function sale(overrides: Partial<ConstructorParameters<typeof Sale>[0]> = {}) {
  return new Sale({
    createdAt: fixedDate,
    customerId: null,
    discountAmount: 0,
    discountAuthorizedBy: null,
    discountReason: null,
    id: "sale-1",
    items: [
      {
        id: "sale-item-1",
        productId: "bread",
        quantity: 2,
        unitCost: 1.5,
        unitPrice: 3,
      },
    ],
    notes: "",
    oversellApprovedBy: null,
    oversellJustification: null,
    paidAt: null,
    paymentMethod: "cash",
    status: "open",
    updatedAt: fixedDate,
    ...overrides,
  });
}

function cashEntry(overrides: Partial<ConstructorParameters<typeof CashEntry>[0]> = {}) {
  return new CashEntry({
    amount: 100,
    category: "Vendas",
    createdAt: fixedDate,
    description: "Venda no caixa",
    dueDate: fixedDate,
    id: "cash-entry-1",
    referenceId: null,
    settledAt: fixedDate,
    status: "settled",
    type: "income",
    updatedAt: fixedDate,
    ...overrides,
  });
}

class MemoryProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  async create(): Promise<Product> {
    throw new Error("Nao usado neste teste");
  }

  async deactivate(id: string) {
    const item = await this.findById(id);
    if (!item) throw new Error("Produto nao encontrado");
    item.deactivate();
    return item;
  }

  async findAll() {
    return this.products;
  }

  async findById(id: string) {
    return this.products.find((item) => item.id === id) ?? null;
  }

  async update(): Promise<Product> {
    throw new Error("Nao usado neste teste");
  }
}

class MemorySupplierRepository implements SupplierRepository {
  constructor(private readonly suppliers: Supplier[]) {}

  async create(): Promise<Supplier> {
    throw new Error("Nao usado neste teste");
  }

  async deactivate(): Promise<Supplier> {
    throw new Error("Nao usado neste teste");
  }

  async findAll() {
    return this.suppliers;
  }

  async findById(id: string) {
    return this.suppliers.find((item) => item.id === id) ?? null;
  }

  async update(): Promise<Supplier> {
    throw new Error("Nao usado neste teste");
  }
}

class MemoryCustomerRepository implements CustomerRepository {
  constructor(private readonly customers: Customer[]) {}

  async create(): Promise<Customer> {
    throw new Error("Nao usado neste teste");
  }

  async deactivate(): Promise<Customer> {
    throw new Error("Nao usado neste teste");
  }

  async findAll() {
    return this.customers;
  }

  async findById(id: string) {
    return this.customers.find((item) => item.id === id) ?? null;
  }

  async update(): Promise<Customer> {
    throw new Error("Nao usado neste teste");
  }
}

class MemoryInventoryRepository implements InventoryRepository {
  movements: StockMovement[] = [];

  constructor(private readonly balances: InventoryBalance[] = []) {}

  async findBalances() {
    return this.balances;
  }

  async findLots() {
    return [];
  }

  async findMovements() {
    return this.movements;
  }

  async findPhysicalCounts() {
    return [];
  }

  async registerPhysicalCount(
    input: Parameters<InventoryRepository["registerPhysicalCount"]>[0],
  ) {
    const expectedQuantity =
      this.balances.find((balance) => balance.productId === input.productId)
        ?.quantity ?? 0;

    return new PhysicalInventoryCount({
      countedAt: fixedDate,
      countedBy: input.countedBy,
      countedQuantity: input.countedQuantity,
      divergenceQuantity: input.countedQuantity - expectedQuantity,
      expectedQuantity,
      id: "count-1",
      productId: input.productId,
      reason: input.reason ?? null,
    });
  }

  async registerMovement(input: Parameters<InventoryRepository["registerMovement"]>[0]) {
    const movement = new StockMovement({
      id: `movement-${this.movements.length + 1}`,
      occurredAt: input.occurredAt ?? fixedDate,
      origin: input.origin ?? "manual_adjustment",
      referenceId: input.referenceId ?? null,
      ...input,
    });

    this.movements.push(movement);

    return movement;
  }
}

class MemoryPurchaseRepository implements PurchaseRepository {
  constructor(private readonly purchases: Purchase[] = []) {}

  async approve(input: Parameters<PurchaseRepository["approve"]>[0]) {
    const purchase = await this.findById(input.purchaseId);
    if (!purchase) throw new Error("Compra nao encontrada");
    purchase.approve(input.approvedBy);
    return purchase;
  }

  async cancel(id: string) {
    const purchase = await this.findById(id);
    if (!purchase) throw new Error("Compra nao encontrada");
    purchase.cancel();
    return purchase;
  }

  async create(input: Parameters<PurchaseRepository["create"]>[0]) {
    const purchase = new Purchase({
      createdAt: fixedDate,
      expectedDate: input.expectedDate,
      id: `purchase-${this.purchases.length + 1}`,
      items: input.items.map((item, index) => ({ id: `item-${index + 1}`, ...item })),
      notes: input.notes,
      receivedAt: null,
      status: "draft",
      supplierId: input.supplierId,
      updatedAt: fixedDate,
    });

    this.purchases.push(purchase);

    return purchase;
  }

  async findAll() {
    return this.purchases;
  }

  async findById(id: string) {
    return this.purchases.find((item) => item.id === id) ?? null;
  }

  async findPayables() {
    return [];
  }

  async receive(input: Parameters<PurchaseRepository["receive"]>[0]) {
    const purchase = await this.findById(input.purchaseId);
    if (!purchase) throw new Error("Compra nao encontrada");
    purchase.receive(input.items, input.divergenceReason);
    return purchase;
  }
}

class MemoryRecipeRepository implements RecipeRepository {
  constructor(private readonly recipes: Recipe[]) {}

  async create(input: Parameters<RecipeRepository["create"]>[0]) {
    const created = new Recipe({
      active: true,
      createdAt: fixedDate,
      id: `recipe-${this.recipes.length + 1}`,
      updatedAt: fixedDate,
      version: 1,
      ...input,
    });

    this.recipes.push(created);

    return created;
  }

  async findAll() {
    return this.recipes;
  }

  async findById(id: string) {
    return this.recipes.find((item) => item.id === id) ?? null;
  }
}

class MemoryProductionOrderRepository implements ProductionOrderRepository {
  constructor(private readonly orders: ProductionOrder[] = []) {}

  async cancel(id: string) {
    const order = await this.findById(id);
    if (!order) throw new Error("Producao nao encontrada");
    order.cancel();
    return order;
  }

  async create(order: ProductionOrder) {
    this.orders.push(order);
    return order;
  }

  async findAll() {
    return this.orders;
  }

  async findById(id: string) {
    return this.orders.find((item) => item.id === id) ?? null;
  }

  async finish(id: string) {
    const order = await this.findById(id);
    if (!order) throw new Error("Producao nao encontrada");
    order.finish(fixedDate);
    return order;
  }

  async start(id: string) {
    const order = await this.findById(id);
    if (!order) throw new Error("Producao nao encontrada");
    order.start(fixedDate);
    return order;
  }
}

class MemorySaleRepository implements SaleRepository {
  constructor(private readonly sales: Sale[] = []) {}

  async cancel(id: string) {
    const item = await this.findById(id);
    if (!item) throw new Error("Venda nao encontrada");
    item.cancel();
    return item;
  }

  async create(createdSale: Sale) {
    this.sales.push(createdSale);
    return createdSale;
  }

  async findAll() {
    return this.sales;
  }

  async findById(id: string) {
    return this.sales.find((item) => item.id === id) ?? null;
  }

  async pay(id: string) {
    const item = await this.findById(id);
    if (!item) throw new Error("Venda nao encontrada");
    item.pay();
    return item;
  }
}

class MemoryCashFlowRepository implements CashFlowRepository {
  constructor(private readonly entries: CashEntry[]) {}

  async cancel(id: string) {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry) throw new Error("Lancamento nao encontrado");
    entry.cancel();
    return entry;
  }

  async findAll() {
    return this.entries;
  }

  async register(input: Parameters<CashFlowRepository["register"]>[0]) {
    const entry = new CashEntry({
      createdAt: fixedDate,
      id: `entry-${this.entries.length + 1}`,
      referenceId: input.referenceId ?? null,
      settledAt: input.settledAt ?? null,
      status: input.status ?? "pending",
      updatedAt: fixedDate,
      ...input,
    });

    this.entries.push(entry);

    return entry;
  }

  async settle(id: string) {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry) throw new Error("Lancamento nao encontrado");
    entry.settle(fixedDate);
    return entry;
  }
}

class MemoryCashRegisterRepository implements CashRegisterRepository {
  constructor(private readonly registers: CashRegister[]) {}

  async close(input: Parameters<CashRegisterRepository["close"]>[0]) {
    const cashRegister = this.registers.find((item) => item.id === input.cashRegisterId);
    if (!cashRegister) throw new Error("Caixa nao encontrado");
    cashRegister.close(input);
    return cashRegister;
  }

  async findCurrentOpen() {
    return this.registers.find((item) => item.status === "open") ?? null;
  }

  async findRegisters() {
    return this.registers;
  }

  async open(input: Parameters<CashRegisterRepository["open"]>[0]) {
    const cashRegister = new CashRegister({
      closedAt: null,
      closedBy: null,
      closingNote: null,
      countedAmount: null,
      createdAt: fixedDate,
      differenceAmount: null,
      expectedAmount: null,
      id: `cash-register-${this.registers.length + 1}`,
      openedAt: fixedDate,
      status: "open",
      updatedAt: fixedDate,
      ...input,
    });

    this.registers.push(cashRegister);

    return cashRegister;
  }
}

describe("Produtos e insumos", () => {
  it("classifica corretamente itens vendaveis, compraveis e produziveis", () => {
    const flour = product({ kind: "raw_material", salePrice: 0 });
    const bread = product({
      id: "bread",
      kind: "finished_product",
      name: "Pao frances",
      salePrice: 1,
    });

    assert.equal(flour.isPurchasable(), true);
    assert.equal(flour.canBeRecipeIngredient(), true);
    assert.equal(flour.isSellable(), false);
    assert.equal(bread.canBeProduced(), true);
    assert.equal(bread.isSellable(), true);
  });

  it("bloqueia preco de venda zerado para produto acabado", () => {
    assert.throws(
      () => product({ kind: "finished_product", salePrice: 0 }),
      /Preco de venda deve ser maior que zero/,
    );
  });
});

describe("Estoque rastreavel", () => {
  it("registra perda somente para produto ativo", async () => {
    const inventory = new MemoryInventoryRepository();
    const useCase = new RegisterLossUseCase(
      inventory,
      new MemoryProductRepository([product()]),
    );

    const movement = await useCase.execute({
      productId: "product-1",
      quantity: 2,
      reason: "Produto vencido",
    });

    assert.equal(movement.type, "loss");
    assert.equal(movement.unitCost, 4);
    assert.equal(inventory.movements.length, 1);
  });

  it("registra ajuste e calcula saldo abaixo do minimo", async () => {
    const balance = new InventoryBalance({
      averageCost: 4,
      minimumStock: 10,
      productId: "product-1",
      quantity: 8,
    });
    const inventory = new MemoryInventoryRepository([balance]);
    const useCase = new RegisterInventoryAdjustmentUseCase(
      inventory,
      new MemoryProductRepository([product()]),
    );

    const movement = await useCase.execute({
      productId: "product-1",
      quantity: 3,
      reason: "Inventario fisico",
    });

    assert.equal(balance.isBelowMinimum, true);
    assert.equal(balance.estimatedValue, 32);
    assert.equal(movement.type, "adjustment");
  });

  it("exige referencia para movimentacoes transacionais", () => {
    assert.throws(
      () =>
        new StockMovement({
          id: "movement-1",
          occurredAt: fixedDate,
          origin: "sale",
          productId: "bread",
          quantity: 1,
          reason: "Venda",
          referenceId: null,
          type: "sale_out",
          unitCost: 1,
        }),
      /referencia de origem/,
    );
  });

  it("registra contagem fisica com divergencia justificada", async () => {
    const inventory = new MemoryInventoryRepository([
      new InventoryBalance({
        averageCost: 4,
        minimumStock: 5,
        productId: "product-1",
        quantity: 10,
      }),
    ]);
    const useCase = new RegisterPhysicalInventoryCountUseCase(
      inventory,
      new MemoryProductRepository([product()]),
    );

    const count = await useCase.execute({
      countedBy: "Gerencia",
      countedQuantity: 8,
      productId: "product-1",
      reason: "Quebra encontrada na conferencia",
    });

    assert.equal(count.expectedQuantity, 10);
    assert.equal(count.countedQuantity, 8);
    assert.equal(count.divergenceQuantity, -2);
    assert.equal(count.hasDivergence, true);
  });

  it("bloqueia divergencia de inventario sem justificativa", async () => {
    const inventory = new MemoryInventoryRepository([
      new InventoryBalance({
        averageCost: 4,
        minimumStock: 5,
        productId: "product-1",
        quantity: 10,
      }),
    ]);
    const useCase = new RegisterPhysicalInventoryCountUseCase(
      inventory,
      new MemoryProductRepository([product()]),
    );

    await assert.rejects(
      () =>
        useCase.execute({
          countedBy: "Gerencia",
          countedQuantity: 8,
          productId: "product-1",
        }),
      /justificativa/,
    );
  });
});

describe("Compras com custo", () => {
  it("cria compra apenas com fornecedor ativo e produto compravel", async () => {
    const finance: PurchaseFinanceGateway = {
      cancelPayable: async () => undefined,
      registerPayable: async (purchase) => {
        assert.equal(purchase.total, 80);
      },
    };
    const useCase = new CreatePurchaseUseCase(
      new MemoryPurchaseRepository(),
      new MemoryProductRepository([product({ id: "flour" })]),
      new MemorySupplierRepository([supplier()]),
      finance,
    );

    const purchase = await useCase.execute({
      expectedDate: fixedDate,
      items: [{ productId: "flour", quantity: 20, unitCost: 4 }],
      notes: "Reposicao",
      supplierId: "supplier-1",
    });

    assert.equal(purchase.total, 80);
  });

  it("recusa item nao compravel", async () => {
    const useCase = new CreatePurchaseUseCase(
      new MemoryPurchaseRepository(),
      new MemoryProductRepository([
        product({ id: "bread", kind: "finished_product", salePrice: 1 }),
      ]),
      new MemorySupplierRepository([supplier()]),
    );

    await assert.rejects(
      () =>
        useCase.execute({
          expectedDate: fixedDate,
          items: [{ productId: "bread", quantity: 10, unitCost: 1 }],
          notes: "",
          supplierId: "supplier-1",
        }),
      /compraveis ativos/,
    );
  });

  it("aprova compra antes do recebimento", async () => {
    const repository = new MemoryPurchaseRepository([
      new Purchase({
        createdAt: fixedDate,
        expectedDate: fixedDate,
        id: "purchase-1",
        items: [{ id: "item-1", productId: "flour", quantity: 10, unitCost: 4 }],
        notes: "Reposicao",
        receivedAt: null,
        status: "pending_approval",
        supplierId: "supplier-1",
        updatedAt: fixedDate,
      }),
    ]);
    const useCase = new ApprovePurchaseUseCase(repository);

    const purchase = await useCase.execute({
      approvedBy: "Gerencia",
      purchaseId: "purchase-1",
    });

    assert.equal(purchase.status, "approved");
    assert.equal(purchase.approvedBy, "Gerencia");
  });

  it("recebe parcialmente com divergencia justificada", async () => {
    const repository = new MemoryPurchaseRepository([
      new Purchase({
        approvedAt: fixedDate,
        approvedBy: "Gerencia",
        createdAt: fixedDate,
        expectedDate: fixedDate,
        id: "purchase-1",
        items: [{ id: "item-1", productId: "flour", quantity: 10, unitCost: 4 }],
        notes: "Reposicao",
        receivedAt: null,
        status: "approved",
        supplierId: "supplier-1",
        updatedAt: fixedDate,
      }),
    ]);
    const inventory: PurchaseInventoryGateway = {
      registerReceipt: async (purchase) => {
        assert.equal(purchase.status, "partially_received");
      },
      reverseReceipt: async () => undefined,
    };
    const useCase = new ReceivePurchaseUseCase(repository, inventory);

    const purchase = await useCase.execute({
      divergenceReason: "Fornecedor entregou menos volumes",
      items: [{ productId: "flour", receivedQuantity: 8 }],
      purchaseId: "purchase-1",
      receivedBy: "Estoque",
    });

    assert.equal(purchase.status, "partially_received");
    assert.equal(purchase.items[0].receivedQuantity, 8);
    assert.equal(purchase.hasDivergence, true);
  });

  it("bloqueia recebimento parcial sem justificativa", async () => {
    const repository = new MemoryPurchaseRepository([
      new Purchase({
        approvedAt: fixedDate,
        approvedBy: "Gerencia",
        createdAt: fixedDate,
        expectedDate: fixedDate,
        id: "purchase-1",
        items: [{ id: "item-1", productId: "flour", quantity: 10, unitCost: 4 }],
        notes: "Reposicao",
        receivedAt: null,
        status: "approved",
        supplierId: "supplier-1",
        updatedAt: fixedDate,
      }),
    ]);
    const inventory: PurchaseInventoryGateway = {
      registerReceipt: async () => undefined,
      reverseReceipt: async () => undefined,
    };
    const useCase = new ReceivePurchaseUseCase(repository, inventory);

    await assert.rejects(
      () =>
        useCase.execute({
          items: [{ productId: "flour", receivedQuantity: 8 }],
          purchaseId: "purchase-1",
          receivedBy: "Estoque",
        }),
      /justificativa/,
    );
  });
});

describe("Producao e receitas versionadas", () => {
  it("cria receita apenas com produto fabricado e insumos validos", async () => {
    const useCase = new CreateRecipeUseCase(
      new MemoryRecipeRepository([]),
      new MemoryProductRepository([
        product({ id: "bread", kind: "finished_product", name: "Pao", salePrice: 1 }),
        product({ id: "flour", kind: "raw_material", name: "Farinha" }),
      ]),
    );

    const createdRecipe = await useCase.execute({
      ingredients: [{ productId: "flour", quantity: 2 }],
      name: "Pao frances",
      outputProductId: "bread",
      yieldQuantity: 10,
    });

    assert.deepEqual(createdRecipe.scaleIngredients(20), [
      { productId: "flour", quantity: 4 },
    ]);
  });

  it("cria ordem com snapshot da receita e custo dos insumos", async () => {
    const useCase = new CreateProductionOrderUseCase(
      new MemoryProductionOrderRepository(),
      new MemoryRecipeRepository([recipe()]),
      new MemoryProductRepository([
        product({ id: "bread", kind: "finished_product", name: "Pao", salePrice: 1 }),
        product({ id: "flour", kind: "raw_material", name: "Farinha", purchasePrice: 4 }),
      ]),
    );

    const order = await useCase.execute({
      notes: "Fornada matinal",
      quantityProduced: 20,
      recipeId: "recipe-1",
    });

    assert.equal(order.recipeSnapshot.recipeVersion, 2);
    assert.equal(order.totalCost, 16);
    assert.equal(order.unitCost, 0.8);
  });

  it("respeita transicoes de status da producao", () => {
    const order = productionOrder();

    order.start(fixedDate);
    order.finish(fixedDate);

    assert.equal(order.status, "finished");
    assert.throws(() => order.cancel(), /finalizada nao pode ser cancelada/);
  });
});

describe("Vendas com estoque, desconto e cancelamento", () => {
  it("paga venda a vista, baixa estoque e registra financeiro", async () => {
    const inventoryGatewayCalls: string[] = [];
    const financeCalls: string[] = [];
    const useCase = new CreateSaleUseCase(
      new MemorySaleRepository(),
      new MemoryProductRepository([
        product({ id: "bread", kind: "finished_product", name: "Pao", salePrice: 3 }),
      ]),
      new MemoryCustomerRepository([]),
      new MemoryInventoryRepository([
        new InventoryBalance({
          averageCost: 1.5,
          minimumStock: 10,
          productId: "bread",
          quantity: 30,
        }),
      ]),
      {
        registerSale: async () => {
          inventoryGatewayCalls.push("registerSale");
        },
        reverseSale: async () => undefined,
      },
      {
        cancelReceivable: async () => undefined,
        registerReceivable: async (createdSale) => {
          financeCalls.push(createdSale.status);
        },
      },
    );

    const createdSale = await useCase.execute({
      items: [{ productId: "bread", quantity: 2, unitPrice: 3 }],
      notes: "",
      paymentMethod: "cash",
    });

    assert.equal(createdSale.status, "paid");
    assert.deepEqual(inventoryGatewayCalls, ["registerSale"]);
    assert.deepEqual(financeCalls, ["paid"]);
  });

  it("exige autorizacao para desconto acima de 10%", () => {
    assert.throws(
      () => sale({ discountAmount: 1, items: [{ ...sale().items[0], unitPrice: 3 }] }),
      /Desconto acima do limite exige autorizacao/,
    );
  });

  it("exige aprovacao para vender acima do estoque", async () => {
    const useCase = new CreateSaleUseCase(
      new MemorySaleRepository(),
      new MemoryProductRepository([
        product({ id: "bread", kind: "finished_product", name: "Pao", salePrice: 3 }),
      ]),
      new MemoryCustomerRepository([]),
      new MemoryInventoryRepository([
        new InventoryBalance({
          averageCost: 1.5,
          minimumStock: 10,
          productId: "bread",
          quantity: 1,
        }),
      ]),
      {
        registerSale: async () => undefined,
        reverseSale: async () => undefined,
      },
      {
        cancelReceivable: async () => undefined,
        registerReceivable: async () => undefined,
      },
    );

    await assert.rejects(
      () =>
        useCase.execute({
          items: [{ productId: "bread", quantity: 2, unitPrice: 3 }],
          notes: "",
          paymentMethod: "cash",
        }),
      /acima do estoque exige responsavel/,
    );
  });
});

describe("Caixa e lucratividade", () => {
  it("consolida fluxo de caixa ignorando lancamentos cancelados", async () => {
    const summary = await new GetCashFlowSummaryUseCase(
      new MemoryCashFlowRepository([
        cashEntry({ amount: 100, status: "settled", type: "income" }),
        cashEntry({
          amount: 40,
          id: "cash-entry-2",
          status: "pending",
          type: "expense",
        }),
        cashEntry({
          amount: 900,
          id: "cash-entry-3",
          status: "cancelled",
          type: "income",
        }),
      ]),
    ).execute();

    assert.deepEqual(summary, {
      balance: 100,
      expense: 0,
      income: 100,
      pendingExpense: 40,
      pendingIncome: 0,
      projectedBalance: 60,
    });
  });

  it("fecha caixa com valor esperado calculado a partir dos lancamentos", async () => {
    const register = new CashRegister({
      closedAt: null,
      closedBy: null,
      closingNote: null,
      countedAmount: null,
      createdAt: fixedDate,
      differenceAmount: null,
      expectedAmount: null,
      id: "cash-register-1",
      openedAt: fixedDate,
      openedBy: "caixa-1",
      openingAmount: 50,
      status: "open",
      updatedAt: fixedDate,
    });

    const closed = await new CloseCashRegisterUseCase(
      new MemoryCashRegisterRepository([register]),
      new MemoryCashFlowRepository([
        cashEntry({ amount: 100, type: "income" }),
        cashEntry({ amount: 20, id: "cash-entry-2", type: "expense" }),
      ]),
    ).execute({
      cashRegisterId: "cash-register-1",
      closedBy: "gerente-1",
      countedAmount: 130,
    });

    assert.equal(closed.status, "closed");
    assert.equal(closed.expectedAmount, 130);
    assert.equal(closed.differenceAmount, 0);
  });

  it("calcula margem bruta da venda", () => {
    const profitableSale = sale();

    assert.equal(profitableSale.total, 6);
    assert.equal(profitableSale.totalCost, 3);
    assert.equal(profitableSale.grossMargin, 3);
  });
});

describe("Permissoes e auditoria", () => {
  it("aplica permissoes por papel operacional", () => {
    assert.equal(hasPermission("owner", "permissions:manage"), true);
    assert.equal(hasPermission("manager", "permissions:manage"), false);
    assert.equal(hasEveryPermission("cashier", ["sales:create", "finance:close-register"]), true);
    assert.equal(hasPermission("viewer", "sales:create"), false);
  });

  it("valida campos obrigatorios de auditoria e protege metadata", () => {
    const log = new AuditLog({
      action: "sale.create",
      description: "Venda criada",
      entity: "sale",
      entityId: "sale-1",
      id: "audit-1",
      metadata: { total: 10 },
      occurredAt: fixedDate,
      result: "success",
      userId: "user-1",
      userName: "Dono",
      userRole: "owner",
    });

    const metadata = log.metadata;
    metadata.total = 999;

    assert.equal(log.metadata.total, 10);
    assert.throws(
      () =>
        new AuditLog({
          ...log.toJSON(),
          action: "",
        }),
      /Acao da auditoria/,
    );
  });
});
