import {
  AuditLog,
  AuditLogFilter,
  AuditLogRepository,
  CashEntry,
  CashFlowRepository,
  InventoryBalance,
  InventoryRepository,
  Product,
  ProductRepository,
  ProductionOrder,
  ProductionOrderRepository,
  Purchase,
  PurchaseRepository,
  RegisterAuditLogInput,
  RegisterCashEntryInput,
  RegisterPhysicalInventoryCountInput,
  RegisterStockMovementInput,
  Sale,
  SaleRepository,
  StockMovement,
} from "@paobom/domain";

const now = new Date();
const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

const products = [
  new Product({
    active: true,
    category: "Insumo",
    createdAt: yesterday,
    id: "prod-farinha",
    kind: "raw_material",
    minimumStock: 25,
    name: "Farinha de trigo 25kg",
    purchasePrice: 92,
    salePrice: 0,
    sku: "FAR-25KG",
    unit: "package",
    updatedAt: now,
  }),
  new Product({
    active: true,
    category: "Produto acabado",
    createdAt: yesterday,
    id: "prod-pao-frances",
    kind: "finished_product",
    minimumStock: 120,
    name: "Pao frances",
    purchasePrice: 0.22,
    salePrice: 0.65,
    sku: "PAO-FRANCES",
    unit: "unit",
    updatedAt: now,
  }),
  new Product({
    active: true,
    category: "Produto acabado",
    createdAt: yesterday,
    id: "prod-sonho",
    kind: "finished_product",
    minimumStock: 25,
    name: "Sonho creme",
    purchasePrice: 1.1,
    salePrice: 4.5,
    sku: "SONHO-CREME",
    unit: "unit",
    updatedAt: now,
  }),
];

const balances = [
  new InventoryBalance({
    averageCost: 92,
    minimumStock: 25,
    productId: "prod-farinha",
    quantity: 18,
  }),
  new InventoryBalance({
    averageCost: 0.22,
    minimumStock: 120,
    productId: "prod-pao-frances",
    quantity: 260,
  }),
  new InventoryBalance({
    averageCost: 1.1,
    minimumStock: 25,
    productId: "prod-sonho",
    quantity: 14,
  }),
];

const movements = [
  new StockMovement({
    id: "mov-loss-sonho",
    occurredAt: now,
    origin: "loss",
    productId: "prod-sonho",
    quantity: 6,
    reason: "Validade expirada",
    referenceId: null,
    type: "loss",
    unitCost: 1.1,
  }),
  new StockMovement({
    id: "mov-sale-pao",
    occurredAt: now,
    origin: "sale",
    productId: "prod-pao-frances",
    quantity: 80,
    reason: "Venda balcao",
    referenceId: "sale-1",
    type: "sale_out",
    unitCost: 0.22,
  }),
];

const sales = [
  new Sale({
    createdAt: now,
    customerId: null,
    discountAmount: 0,
    discountAuthorizedBy: null,
    discountReason: null,
    id: "sale-1",
    items: [
      {
        id: "sale-item-1",
        productId: "prod-pao-frances",
        quantity: 80,
        unitCost: 0.22,
        unitPrice: 0.65,
      },
      {
        id: "sale-item-2",
        productId: "prod-sonho",
        quantity: 12,
        unitCost: 1.1,
        unitPrice: 4.5,
      },
    ],
    notes: "Balcao manha",
    oversellApprovedBy: null,
    oversellJustification: null,
    paidAt: now,
    paymentMethod: "pix",
    status: "paid",
    updatedAt: now,
  }),
  new Sale({
    createdAt: now,
    customerId: null,
    discountAmount: 2,
    discountAuthorizedBy: null,
    discountReason: null,
    id: "sale-2",
    items: [
      {
        id: "sale-item-3",
        productId: "prod-sonho",
        quantity: 6,
        unitCost: 1.1,
        unitPrice: 4.5,
      },
    ],
    notes: "Encomenda aguardando pagamento",
    oversellApprovedBy: null,
    oversellJustification: null,
    paidAt: null,
    paymentMethod: "invoice",
    status: "open",
    updatedAt: now,
  }),
];

const cashEntries = [
  new CashEntry({
    amount: 106,
    category: "Vendas",
    createdAt: now,
    description: "Vendas balcao",
    dueDate: now,
    id: "cash-1",
    referenceId: "sale-1",
    settledAt: now,
    status: "settled",
    type: "income",
    updatedAt: now,
  }),
  new CashEntry({
    amount: 184,
    category: "Compras",
    createdAt: now,
    description: "Reposicao de insumos",
    dueDate: now,
    id: "cash-2",
    referenceId: "purchase-1",
    settledAt: null,
    status: "pending",
    type: "expense",
    updatedAt: now,
  }),
];

const purchases = [
  new Purchase({
    createdAt: now,
    expectedDate: now,
    id: "purchase-1",
    items: [
      {
        id: "purchase-item-1",
        productId: "prod-farinha",
        quantity: 2,
        unitCost: 92,
      },
    ],
    notes: "Compra emergencial",
    receivedAt: null,
    status: "ordered",
    supplierId: "supplier-1",
    updatedAt: now,
  }),
];

const productions = [
  new ProductionOrder({
    completedAt: now,
    createdAt: yesterday,
    id: "production-1",
    ingredientConsumptions: [
      {
        productId: "prod-farinha",
        quantity: 1,
        unitCost: 92,
      },
    ],
    notes: "Lote da manha",
    outputProductId: "prod-pao-frances",
    quantityProduced: 420,
    recipeId: "recipe-1",
    recipeSnapshot: {
      ingredients: [{ productId: "prod-farinha", quantity: 1 }],
      outputProductId: "prod-pao-frances",
      recipeId: "recipe-1",
      recipeName: "Pao frances base",
      recipeVersion: 2,
      yieldQuantity: 420,
    },
    startedAt: yesterday,
    status: "finished",
  }),
  new ProductionOrder({
    completedAt: null,
    createdAt: now,
    id: "production-2",
    ingredientConsumptions: [
      {
        productId: "prod-farinha",
        quantity: 0.5,
        unitCost: 92,
      },
    ],
    notes: "Reposicao tarde",
    outputProductId: "prod-sonho",
    quantityProduced: 48,
    recipeId: "recipe-2",
    recipeSnapshot: {
      ingredients: [{ productId: "prod-farinha", quantity: 0.5 }],
      outputProductId: "prod-sonho",
      recipeId: "recipe-2",
      recipeName: "Sonho creme",
      recipeVersion: 1,
      yieldQuantity: 48,
    },
    startedAt: now,
    status: "started",
  }),
];

const auditLogs = [
  new AuditLog({
    action: "mobile.sync",
    description: "Dados operacionais carregados no mobile",
    entity: "mobile",
    entityId: null,
    id: "audit-mobile-sync",
    metadata: { source: "mock" },
    occurredAt: now,
    result: "success",
    userId: "user-manager",
    userName: "Gerencia",
    userRole: "manager",
  }),
  new AuditLog({
    action: "inventory.loss",
    description: "Perda de sonho registrada",
    entity: "inventory",
    entityId: "prod-sonho",
    id: "audit-loss-sonho",
    metadata: { quantity: 6 },
    occurredAt: now,
    result: "success",
    userId: "user-stock",
    userName: "Estoque",
    userRole: "stock",
  }),
];

export class MockBakeryOperationsRepository
  implements ProductRepository {
  async findAll() {
    return products;
  }

  async findById() {
    return null;
  }

  async create() {
    return Promise.reject<Product>(
      new Error("Mobile nao cria registros neste modo"),
    );
  }

  async update() {
    return Promise.reject<Product>(
      new Error("Mobile nao atualiza registros neste modo"),
    );
  }

  async deactivate() {
    return Promise.reject<Product>(
      new Error("Mobile nao inativa registros neste modo"),
    );
  }
}

export class MockMobileInventoryRepository implements InventoryRepository {
  async findBalances() {
    return balances;
  }

  async findLots() {
    return [];
  }

  async findMovements() {
    return movements;
  }

  async findPhysicalCounts() {
    return [];
  }

  async registerPhysicalCount(_input: RegisterPhysicalInventoryCountInput) {
    return Promise.reject(
      new Error("Mobile nao registra inventario fisico neste modo"),
    );
  }

  async registerMovement(_input: RegisterStockMovementInput) {
    return Promise.reject<StockMovement>(
      new Error("Mobile nao registra movimentos neste modo"),
    );
  }
}

export class MockMobileSaleRepository implements SaleRepository {
  async findAll() {
    return sales;
  }

  async findById() {
    return null;
  }

  async create() {
    return Promise.reject<Sale>(new Error("Mobile nao cria vendas neste modo"));
  }

  async pay() {
    return Promise.reject<Sale>(
      new Error("Mobile nao recebe vendas neste modo"),
    );
  }

  async cancel() {
    return Promise.reject<Sale>(
      new Error("Mobile nao cancela registros neste modo"),
    );
  }
}

export class MockMobileCashFlowRepository implements CashFlowRepository {
  async findAll() {
    return cashEntries;
  }

  async register(_input: RegisterCashEntryInput) {
    return Promise.reject<CashEntry>(
      new Error("Mobile nao registra lancamentos neste modo"),
    );
  }

  async settle() {
    return Promise.reject<CashEntry>(
      new Error("Mobile nao baixa lancamentos neste modo"),
    );
  }

  async cancel() {
    return Promise.reject<CashEntry>(
      new Error("Mobile nao cancela lancamentos neste modo"),
    );
  }
}

export class MockMobilePurchaseRepository implements PurchaseRepository {
  async findAll() {
    return purchases;
  }

  async findById() {
    return null;
  }

  async create() {
    return Promise.reject<Purchase>(
      new Error("Mobile nao cria compras neste modo"),
    );
  }

  async receive() {
    return Promise.reject<Purchase>(
      new Error("Mobile nao recebe compras neste modo"),
    );
  }

  async cancel() {
    return Promise.reject<Purchase>(
      new Error("Mobile nao cancela compras neste modo"),
    );
  }
}

export class MockMobileProductionOrderRepository
  implements ProductionOrderRepository
{
  async findAll() {
    return productions;
  }

  async findById() {
    return null;
  }

  async create() {
    return Promise.reject<ProductionOrder>(
      new Error("Mobile nao cria ordens neste modo"),
    );
  }

  async start() {
    return Promise.reject<ProductionOrder>(
      new Error("Mobile nao inicia producao neste modo"),
    );
  }

  async finish() {
    return Promise.reject<ProductionOrder>(
      new Error("Mobile nao finaliza producao neste modo"),
    );
  }

  async cancel() {
    return Promise.reject<ProductionOrder>(
      new Error("Mobile nao cancela producao neste modo"),
    );
  }
}

export class MockMobileAuditLogRepository implements AuditLogRepository {
  async findAll(filter: AuditLogFilter = {}) {
    return auditLogs.filter((log) => matchesAuditFilter(log, filter));
  }

  async register(input: RegisterAuditLogInput) {
    const log = new AuditLog({
      ...input,
      id: `audit-${Date.now()}`,
      occurredAt: input.occurredAt ?? new Date(),
    });

    auditLogs.unshift(log);

    return log;
  }
}

function matchesAuditFilter(log: AuditLog, filter: AuditLogFilter) {
  if (filter.entity && log.entity !== filter.entity) {
    return false;
  }

  if (filter.action && !log.action.includes(filter.action)) {
    return false;
  }

  return true;
}
