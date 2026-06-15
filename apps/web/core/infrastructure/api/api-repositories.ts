import {
  AuditLog,
  AuditLogFilter,
  AuditLogRepository,
  CashEntry,
  CashFlowRepository,
  CashReconciliation,
  CashRegister,
  CashRegisterMovement,
  CashRegisterRepository,
  CloseCashRegisterRepositoryInput,
  CreateCustomerInput,
  CreateProductInput,
  CreatePurchaseInput,
  CreateRecipeInput,
  Customer,
  CustomerInteraction,
  CustomerRelationshipRepository,
  CustomerRepository,
  InventoryBalance,
  InventoryLot,
  InventoryRepository,
  PhysicalInventoryCount,
  Product,
  ProductRepository,
  ProductionInventoryGateway,
  ProductionOrder,
  ProductionOrderRepository,
  Purchase,
  PurchasePayable,
  PurchaseFinanceGateway,
  PurchaseInventoryGateway,
  PurchaseRepository,
  Recipe,
  RecipeRepository,
  RegisterAuditLogInput,
  RegisterCashEntryInput,
  RegisterCashRegisterMovementInput,
  RegisterCustomerInteractionInput,
  RegisterPhysicalInventoryCountInput,
  RegisterStockMovementInput,
  ReconcileCashRegisterInput,
  Sale,
  SaleFinanceGateway,
  SaleInventoryGateway,
  SaleRepository,
  StockMovement,
  Supplier,
  SupplierRepository,
  UpdateCustomerInput,
  UpdateProductInput,
  UpdateSupplierInput,
} from "@paobom/domain";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { HealthRepository } from "@/features/health/domain/ports/HealthRepository";
import { SystemHealth } from "@/features/health/domain/entities/SystemHealth";

type ApiRecord = Record<string, unknown>;

export class ApiHealthRepository implements HealthRepository {
  constructor(private readonly api: ApiClient) {}

  async getCurrentStatus() {
    const health = await this.api.get<{ service: string; status: string }>("/health", {
      auth: false,
    });

    return new SystemHealth(
      health.status === "ok" ? "operational" : "degraded",
      new Date(),
    );
  }
}

export class ApiProductRepository implements ProductRepository {
  constructor(private readonly api: ApiClient) {}

  async create(input: CreateProductInput) {
    return toProduct(await this.api.post<ApiRecord>("/products", input));
  }

  async deactivate(id: string) {
    return toProduct(await this.api.delete<ApiRecord>(`/products/${id}`));
  }

  async findAll() {
    const products = await this.api.get<ApiRecord[]>("/products");

    return products.map(toProduct);
  }

  async findById(id: string) {
    try {
      return toProduct(await this.api.get<ApiRecord>(`/products/${id}`));
    } catch {
      return null;
    }
  }

  async update(id: string, input: UpdateProductInput) {
    return toProduct(await this.api.patch<ApiRecord>(`/products/${id}`, input));
  }
}

export class ApiSupplierRepository implements SupplierRepository {
  constructor(private readonly api: ApiClient) {}

  async create(input: Parameters<SupplierRepository["create"]>[0]) {
    return toSupplier(await this.api.post<ApiRecord>("/suppliers", input));
  }

  async deactivate(id: string) {
    return toSupplier(await this.api.delete<ApiRecord>(`/suppliers/${id}`));
  }

  async findAll() {
    const suppliers = await this.api.get<ApiRecord[]>("/suppliers");

    return suppliers.map(toSupplier);
  }

  async findById(id: string) {
    return (await this.findAll()).find((supplier) => supplier.id === id) ?? null;
  }

  async update(id: string, input: UpdateSupplierInput) {
    return toSupplier(await this.api.patch<ApiRecord>(`/suppliers/${id}`, input));
  }
}

export class ApiCustomerRepository implements CustomerRepository {
  constructor(private readonly api: ApiClient) {}

  async create(input: CreateCustomerInput) {
    return toCustomer(await this.api.post<ApiRecord>("/customers", input));
  }

  async deactivate(id: string) {
    return toCustomer(await this.api.delete<ApiRecord>(`/customers/${id}`));
  }

  async findAll() {
    const customers = await this.api.get<ApiRecord[]>("/customers");

    return customers.map(toCustomer);
  }

  async findById(id: string) {
    return (await this.findAll()).find((customer) => customer.id === id) ?? null;
  }

  async update(id: string, input: UpdateCustomerInput) {
    return toCustomer(await this.api.patch<ApiRecord>(`/customers/${id}`, input));
  }
}

export class ApiCustomerRelationshipRepository
  implements CustomerRelationshipRepository
{
  constructor(private readonly api: ApiClient) {}

  async cancel(): Promise<CustomerInteraction> {
    throw new Error("Cancelamento de interacao ainda nao existe na API real");
  }

  async complete(): Promise<CustomerInteraction> {
    throw new Error("Conclusao de interacao ainda nao existe na API real");
  }

  async findAll() {
    const customers = await this.api.get<ApiRecord[]>("/customers");

    return customers.flatMap((customer) =>
      getArray(customer.interactions).map((interaction) =>
        toCustomerInteraction(interaction, String(customer.id)),
      ),
    );
  }

  async register(input: RegisterCustomerInteractionInput) {
    return toCustomerInteraction(
      await this.api.post<ApiRecord>(`/customers/${input.customerId}/interactions`, {
        description: `${input.subject}\n${input.notes}`,
        occurredAt: input.occurredAt,
        type: input.type,
      }),
      input.customerId,
    );
  }
}

export class ApiInventoryRepository implements InventoryRepository {
  constructor(private readonly api: ApiClient) {}

  async findBalances() {
    const balances = await this.api.get<ApiRecord[]>("/inventory/balances");

    return balances.map(toInventoryBalance);
  }

  async findLots() {
    const lots = await this.api.get<ApiRecord[]>("/inventory/lots");

    return lots.map(toInventoryLot);
  }

  async findMovements() {
    const movements = await this.api.get<ApiRecord[]>("/inventory/movements");

    return movements.map(toStockMovement);
  }

  async findPhysicalCounts() {
    const counts = await this.api.get<ApiRecord[]>("/inventory/counts");

    return counts.map(toPhysicalInventoryCount);
  }

  async registerPhysicalCount(input: RegisterPhysicalInventoryCountInput) {
    return toPhysicalInventoryCount(
      await this.api.post<ApiRecord>("/inventory/counts", input),
    );
  }

  async registerMovement(input: RegisterStockMovementInput) {
    const origin =
      input.origin ?? (input.type === "loss" ? "loss" : "manual_adjustment");

    return toStockMovement(
      await this.api.post<ApiRecord>("/inventory/movements", {
        ...input,
        origin,
      }),
    );
  }
}

export class ApiRecipeRepository implements RecipeRepository {
  constructor(private readonly api: ApiClient) {}

  async create(input: CreateRecipeInput) {
    return toRecipe(await this.api.post<ApiRecord>("/production/recipes", input));
  }

  async findAll() {
    const recipes = await this.api.get<ApiRecord[]>("/production/recipes");

    return recipes.map(toRecipe);
  }

  async findById(id: string) {
    return (await this.findAll()).find((recipe) => recipe.id === id) ?? null;
  }
}

export class ApiProductionOrderRepository implements ProductionOrderRepository {
  constructor(private readonly api: ApiClient) {}

  async cancel(id: string) {
    return toProductionOrder(
      await this.api.post<ApiRecord>(`/production/orders/${id}/cancel`, {}),
    );
  }

  async create(order: ProductionOrder) {
    return toProductionOrder(
      await this.api.post<ApiRecord>("/production/orders", {
        notes: order.notes,
        quantityProduced: order.quantityProduced,
        recipeId: order.recipeId,
      }),
    );
  }

  async findAll() {
    const orders = await this.api.get<ApiRecord[]>("/production/orders");

    return orders.map(toProductionOrder);
  }

  async findById(id: string) {
    return (await this.findAll()).find((order) => order.id === id) ?? null;
  }

  async finish(id: string) {
    return toProductionOrder(
      await this.api.post<ApiRecord>(`/production/orders/${id}/finish`, {}),
    );
  }

  async start(id: string) {
    return toProductionOrder(
      await this.api.post<ApiRecord>(`/production/orders/${id}/start`, {}),
    );
  }
}

export class ApiPurchaseRepository implements PurchaseRepository {
  constructor(private readonly api: ApiClient) {}

  async cancel(id: string) {
    return toPurchase(await this.api.post<ApiRecord>(`/purchases/${id}/cancel`, {}));
  }

  async approve(input: Parameters<PurchaseRepository["approve"]>[0]) {
    return toPurchase(
      await this.api.post<ApiRecord>(`/purchases/${input.purchaseId}/approve`, {
        approvedBy: input.approvedBy,
      }),
    );
  }

  async create(input: CreatePurchaseInput) {
    return toPurchase(await this.api.post<ApiRecord>("/purchases", input));
  }

  async findAll() {
    const purchases = await this.api.get<ApiRecord[]>("/purchases");

    return purchases.map(toPurchase);
  }

  async findById(id: string) {
    return (await this.findAll()).find((purchase) => purchase.id === id) ?? null;
  }

  async findPayables() {
    const payables = await this.api.get<ApiRecord[]>("/purchases/payables");

    return payables.map(toPurchasePayable);
  }

  async receive(input: Parameters<PurchaseRepository["receive"]>[0]) {
    return toPurchase(
      await this.api.post<ApiRecord>(`/purchases/${input.purchaseId}/receive`, {
        divergenceReason: input.divergenceReason,
        items: input.items,
        receivedBy: input.receivedBy,
      }),
    );
  }
}

export class ApiSaleRepository implements SaleRepository {
  private paidOnCreate = new Map<string, Sale>();

  constructor(private readonly api: ApiClient) {}

  async cancel(id: string) {
    return toSale(await this.api.post<ApiRecord>(`/sales/${id}/cancel`, {}));
  }

  async create(sale: Sale) {
    const created = toSale(
      await this.api.post<ApiRecord>("/sales", {
        customerId: sale.customerId,
        discountAmount: sale.discountAmount,
        discountAuthorizedBy: sale.discountAuthorizedBy,
        discountReason: sale.discountReason,
        items: sale.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: sale.notes,
        oversellApprovedBy: sale.oversellApprovedBy,
        oversellJustification: sale.oversellJustification,
        paymentMethod: sale.paymentMethod,
        payments: sale.payments.map((payment) => ({
          amount: payment.amount,
          cardBrand: payment.cardBrand,
          installments: payment.installments,
          method: payment.method,
          referenceCode: payment.referenceCode,
        })),
      }),
    );

    if (created.status === "paid") {
      this.paidOnCreate.set(created.id, created);
    }

    return created;
  }

  async findAll() {
    const sales = await this.api.get<ApiRecord[]>("/sales");

    return sales.map(toSale);
  }

  async findById(id: string) {
    return (await this.findAll()).find((sale) => sale.id === id) ?? null;
  }

  async pay(id: string) {
    const alreadyPaid = this.paidOnCreate.get(id);

    if (alreadyPaid) {
      this.paidOnCreate.delete(id);
      return alreadyPaid;
    }

    return toSale(await this.api.post<ApiRecord>(`/sales/${id}/pay`, {}));
  }
}

export class ApiCashFlowRepository
  implements CashFlowRepository, CashRegisterRepository
{
  constructor(private readonly api: ApiClient) {}

  async cancel(id: string) {
    return toCashEntry(await this.api.post<ApiRecord>(`/cash/entries/${id}/cancel`, {}));
  }

  async close(input: CloseCashRegisterRepositoryInput) {
    return toCashRegister(
      await this.api.post<ApiRecord>(`/cash/registers/${input.cashRegisterId}/close`, {
        closedBy: input.closedBy,
        closingNote: input.closingNote,
        countedAmount: input.countedAmount,
      }),
    );
  }

  async findAll() {
    const entries = await this.api.get<ApiRecord[]>("/cash/entries");

    return entries.map(toCashEntry);
  }

  async findCurrentOpen() {
    return (
      (await this.findRegisters()).find((register) => register.status === "open") ??
      null
    );
  }

  async findRegisters() {
    const registers = await this.api.get<ApiRecord[]>("/cash/registers");

    return registers.map(toCashRegister);
  }

  async findMovements() {
    const movements = await this.api.get<ApiRecord[]>("/cash/registers/movements");

    return movements.map(toCashRegisterMovement);
  }

  async findReconciliations() {
    const reconciliations = await this.api.get<ApiRecord[]>(
      "/cash/registers/reconciliations",
    );

    return reconciliations.map(toCashReconciliation);
  }

  async open(input: Parameters<CashRegisterRepository["open"]>[0]) {
    return toCashRegister(await this.api.post<ApiRecord>("/cash/registers/open", input));
  }

  async reconcile(input: ReconcileCashRegisterInput) {
    return toCashReconciliation(
      await this.api.post<ApiRecord>(
        `/cash/registers/${input.cashRegisterId}/reconcile`,
        {
          countedAmount: input.countedAmount,
          expectedAmount: input.expectedAmount,
          method: input.method,
          notes: input.notes,
          reconciledBy: input.reconciledBy,
        },
      ),
    );
  }

  async register(input: RegisterCashEntryInput) {
    return toCashEntry(await this.api.post<ApiRecord>("/cash/entries", input));
  }

  async registerMovement(input: RegisterCashRegisterMovementInput) {
    return toCashRegisterMovement(
      await this.api.post<ApiRecord>(
        `/cash/registers/${input.cashRegisterId}/movements`,
        {
          actor: input.actor,
          amount: input.amount,
          reason: input.reason,
          type: input.type,
        },
      ),
    );
  }

  async settle(id: string) {
    return toCashEntry(await this.api.post<ApiRecord>(`/cash/entries/${id}/settle`, {}));
  }
}

export class ApiAuditLogRepository implements AuditLogRepository {
  constructor(private readonly api: ApiClient) {}

  async findAll(filter: AuditLogFilter = {}) {
    const search = new URLSearchParams();

    if (filter.action) search.set("action", filter.action);
    if (filter.entity) search.set("entity", filter.entity);
    if (filter.userId) search.set("userId", filter.userId);

    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    const logs = await this.api.get<ApiRecord[]>(`/audit-logs${suffix}`);

    return logs.map(toAuditLog);
  }

  async register(input: RegisterAuditLogInput) {
    return toAuditLog(await this.api.post<ApiRecord>("/audit-logs", input));
  }
}

export class NoopPurchaseInventoryGateway implements PurchaseInventoryGateway {
  async registerReceipt() {}
  async reverseReceipt() {}
}

export class NoopPurchaseFinanceGateway implements PurchaseFinanceGateway {
  async cancelPayable() {}
  async registerPayable() {}
}

export class NoopProductionInventoryGateway implements ProductionInventoryGateway {
  async registerProductionFinish() {}
  async registerProductionStart() {}
  async reverseProductionStart() {}
}

export class NoopSaleInventoryGateway implements SaleInventoryGateway {
  async registerSale() {}
  async reverseSale() {}
}

export class NoopSaleFinanceGateway implements SaleFinanceGateway {
  async cancelReceivable() {}
  async registerReceivable() {}
}

function toProduct(record: ApiRecord) {
  return new Product({
    active: booleanValue(record.active, true),
    category: stringValue(record.category),
    createdAt: dateValue(record.createdAt),
    id: stringValue(record.id),
    kind: stringValue(record.kind) as never,
    minimumStock: numberValue(record.minimumStock),
    name: stringValue(record.name),
    purchasePrice: numberValue(record.purchasePrice),
    salePrice: numberValue(record.salePrice),
    sku: stringValue(record.sku),
    unit: stringValue(record.unit) as never,
    updatedAt: dateValue(record.updatedAt),
  });
}

function toSupplier(record: ApiRecord) {
  return new Supplier({
    active: booleanValue(record.active, true),
    contactName: stringValue(record.contactName),
    createdAt: dateValue(record.createdAt),
    document: stringValue(record.document),
    email: stringValue(record.email),
    id: stringValue(record.id),
    name: stringValue(record.name),
    phone: stringValue(record.phone),
    updatedAt: dateValue(record.updatedAt),
  });
}

function toCustomer(record: ApiRecord) {
  return new Customer({
    active: booleanValue(record.active, true),
    createdAt: dateValue(record.createdAt),
    document: stringValue(record.document),
    email: stringValue(record.email),
    id: stringValue(record.id),
    name: stringValue(record.name),
    notes: stringValue(record.notes),
    phone: stringValue(record.phone),
    updatedAt: dateValue(record.updatedAt),
  });
}

function toCustomerInteraction(record: ApiRecord, customerId?: string) {
  const [subject, ...notes] = stringValue(record.description).split("\n");

  return new CustomerInteraction({
    createdAt: dateValue(record.createdAt),
    customerId: stringValue(record.customerId ?? customerId),
    id: stringValue(record.id),
    nextContactAt: null,
    notes: notes.join("\n") || stringValue(record.description),
    occurredAt: dateValue(record.occurredAt),
    status: "open",
    subject: subject || "Interacao com cliente",
    type: normalizeInteractionType(stringValue(record.type)) as never,
    updatedAt: dateValue(record.updatedAt),
  });
}

function toInventoryBalance(record: ApiRecord) {
  return new InventoryBalance({
    averageCost: numberValue(record.averageCost),
    minimumStock: numberValue(record.minimumStock),
    productId: stringValue(record.productId),
    quantity: numberValue(record.quantity),
  });
}

function toInventoryLot(record: ApiRecord) {
  return new InventoryLot({
    expirationDate: nullableDate(record.expirationDate),
    id: stringValue(record.id),
    lotCode: stringValue(record.lotCode),
    productId: stringValue(record.productId),
    purchaseId: nullableString(record.purchaseId),
    quantity: numberValue(record.quantity),
    receivedAt: dateValue(record.receivedAt),
    status: stringValue(record.status) as never,
    supplierId: nullableString(record.supplierId),
    unitCost: numberValue(record.unitCost),
  });
}

function toStockMovement(record: ApiRecord) {
  return new StockMovement({
    id: stringValue(record.id),
    lotId: nullableString(record.lotId),
    occurredAt: dateValue(record.occurredAt),
    origin: stringValue(record.origin) as never,
    productId: stringValue(record.productId),
    quantity: numberValue(record.quantity),
    reason: stringValue(record.reason),
    referenceId: nullableString(record.referenceId),
    type: stringValue(record.type) as never,
    unitCost: numberValue(record.unitCost),
  });
}

function toPhysicalInventoryCount(record: ApiRecord) {
  return new PhysicalInventoryCount({
    countedAt: dateValue(record.countedAt),
    countedBy: stringValue(record.countedBy),
    countedQuantity: numberValue(record.countedQuantity),
    divergenceQuantity: numberValue(record.divergenceQuantity),
    expectedQuantity: numberValue(record.expectedQuantity),
    id: stringValue(record.id),
    productId: stringValue(record.productId),
    reason: nullableString(record.reason),
  });
}

function toRecipe(record: ApiRecord) {
  return new Recipe({
    active: booleanValue(record.active, true),
    createdAt: dateValue(record.createdAt),
    id: stringValue(record.id),
    ingredients: getArray(record.ingredients).map((ingredient) => ({
      productId: stringValue(ingredient.productId),
      quantity: numberValue(ingredient.quantity),
    })),
    name: stringValue(record.name),
    outputProductId: stringValue(record.outputProductId),
    updatedAt: dateValue(record.updatedAt),
    version: numberValue(record.version),
    yieldQuantity: numberValue(record.yieldQuantity),
  });
}

function toProductionOrder(record: ApiRecord) {
  const snapshot = toRecipeSnapshot(record.recipeSnapshot);

  return new ProductionOrder({
    completedAt: nullableDate(record.completedAt),
    createdAt: dateValue(record.createdAt),
    id: stringValue(record.id),
    ingredientConsumptions: getArray(record.ingredientConsumptions).map(
      (item) => ({
        productId: stringValue(item.productId),
        quantity: numberValue(item.quantity),
        unitCost: numberValue(item.unitCost),
      }),
    ),
    notes: stringValue(record.notes),
    outputProductId: stringValue(record.outputProductId),
    quantityProduced: numberValue(record.quantityProduced),
    recipeId: stringValue(record.recipeId),
    recipeSnapshot: snapshot,
    startedAt: nullableDate(record.startedAt),
    status: stringValue(record.status) as never,
  });
}

function toRecipeSnapshot(value: unknown) {
  const record = isRecord(value) ? value : {};

  return {
    ingredients: getArray(record.ingredients).map((ingredient) => ({
      productId: stringValue(ingredient.productId),
      quantity: numberValue(ingredient.quantity),
    })),
    outputProductId: stringValue(record.outputProductId),
    recipeId: stringValue(record.recipeId),
    recipeName: stringValue(record.recipeName),
    recipeVersion: numberValue(record.recipeVersion),
    yieldQuantity: numberValue(record.yieldQuantity),
  };
}

function toPurchase(record: ApiRecord) {
  return new Purchase({
    approvedAt: nullableDate(record.approvedAt),
    approvedBy: nullableString(record.approvedBy),
    createdAt: dateValue(record.createdAt),
    expectedDate: dateValue(record.expectedDate),
    history: getArray(record.history).map((item) => ({
      action: stringValue(item.action) as never,
      actor: stringValue(item.actor),
      description: stringValue(item.description),
      id: stringValue(item.id),
      occurredAt: dateValue(item.occurredAt),
    })),
    id: stringValue(record.id),
    items: getArray(record.items).map((item) => ({
      id: stringValue(item.id),
      productId: stringValue(item.productId),
      quantity: numberValue(item.quantity),
      receivedQuantity: numberValue(item.receivedQuantity),
      unitCost: numberValue(item.unitCost),
    })),
    notes: stringValue(record.notes),
    receivedAt: nullableDate(record.receivedAt),
    status: stringValue(record.status) as never,
    supplierId: stringValue(record.supplierId),
    updatedAt: dateValue(record.updatedAt),
  });
}

function toPurchasePayable(record: ApiRecord) {
  return new PurchasePayable({
    amount: numberValue(record.amount),
    createdAt: dateValue(record.createdAt),
    dueDate: dateValue(record.dueDate),
    id: stringValue(record.id),
    paidAmount: numberValue(record.paidAmount),
    purchaseId: stringValue(record.purchaseId),
    status: stringValue(record.status) as never,
    supplierId: stringValue(record.supplierId),
    updatedAt: dateValue(record.updatedAt),
  });
}

function toSale(record: ApiRecord) {
  return new Sale({
    createdAt: dateValue(record.createdAt),
    customerId: nullableString(record.customerId),
    discountAmount: numberValue(record.discountAmount),
    discountAuthorizedBy: nullableString(record.discountAuthorizedBy),
    discountReason: nullableString(record.discountReason),
    id: stringValue(record.id),
    items: getArray(record.items).map((item) => ({
      id: stringValue(item.id),
      productId: stringValue(item.productId),
      quantity: numberValue(item.quantity),
      unitCost: numberValue(item.unitCost),
      unitPrice: numberValue(item.unitPrice),
    })),
    notes: stringValue(record.notes),
    oversellApprovedBy: nullableString(record.oversellApprovedBy),
    oversellJustification: nullableString(record.oversellJustification),
    paidAt: nullableDate(record.paidAt),
    paymentMethod: stringValue(record.paymentMethod) as never,
    payments: getArray(record.payments).map((payment) => ({
      amount: numberValue(payment.amount),
      cardBrand: nullableString(payment.cardBrand),
      id: stringValue(payment.id),
      installments: numberValue(payment.installments),
      method: stringValue(payment.method) as never,
      referenceCode: nullableString(payment.referenceCode),
    })),
    status: stringValue(record.status) as never,
    updatedAt: dateValue(record.updatedAt),
  });
}

function toCashEntry(record: ApiRecord) {
  return new CashEntry({
    amount: numberValue(record.amount),
    category: stringValue(record.category),
    createdAt: dateValue(record.createdAt),
    description: stringValue(record.description),
    dueDate: dateValue(record.dueDate),
    id: stringValue(record.id),
    referenceId: nullableString(record.referenceId),
    settledAt: nullableDate(record.settledAt),
    status: stringValue(record.status) as never,
    type: stringValue(record.type) as never,
    updatedAt: dateValue(record.updatedAt),
  });
}

function toCashRegister(record: ApiRecord) {
  return new CashRegister({
    closedAt: nullableDate(record.closedAt),
    closedBy: nullableString(record.closedBy),
    closingNote: nullableString(record.closingNote),
    countedAmount: nullableNumber(record.countedAmount),
    createdAt: dateValue(record.createdAt),
    differenceAmount: nullableNumber(record.differenceAmount),
    expectedAmount: nullableNumber(record.expectedAmount),
    id: stringValue(record.id),
    openedAt: dateValue(record.openedAt),
    openedBy: stringValue(record.openedBy),
    openingAmount: numberValue(record.openingAmount),
    status: stringValue(record.status) as never,
    updatedAt: dateValue(record.updatedAt),
  });
}

function toCashRegisterMovement(record: ApiRecord) {
  return new CashRegisterMovement({
    actor: stringValue(record.actor),
    amount: numberValue(record.amount),
    cashRegisterId: stringValue(record.cashRegisterId),
    id: stringValue(record.id),
    occurredAt: dateValue(record.occurredAt),
    reason: stringValue(record.reason),
    type: stringValue(record.type) as never,
  });
}

function toCashReconciliation(record: ApiRecord) {
  return new CashReconciliation({
    cashRegisterId: stringValue(record.cashRegisterId),
    countedAmount: numberValue(record.countedAmount),
    differenceAmount: numberValue(record.differenceAmount),
    expectedAmount: numberValue(record.expectedAmount),
    id: stringValue(record.id),
    method: stringValue(record.method),
    notes: nullableString(record.notes),
    reconciledAt: dateValue(record.reconciledAt),
    reconciledBy: stringValue(record.reconciledBy),
  });
}

function toAuditLog(record: ApiRecord) {
  return new AuditLog({
    action: stringValue(record.action),
    description: stringValue(record.description),
    entity: stringValue(record.entity),
    entityId: nullableString(record.entityId),
    id: stringValue(record.id),
    metadata: flattenMetadata(record.metadata),
    occurredAt: dateValue(record.occurredAt),
    result: stringValue(record.result) as never,
    userId: stringValue(record.userId),
    userName: stringValue(record.userName),
    userRole: stringValue(record.userRole),
  });
}

function flattenMetadata(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean" ||
      entry === null
        ? entry
        : JSON.stringify(entry),
    ]),
  );
}

function normalizeInteractionType(value: string) {
  const validTypes = ["order", "feedback", "complaint", "follow_up", "campaign"];

  return validTypes.includes(value) ? (value as never) : "follow_up";
}

function getArray(value: unknown): ApiRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function nullableString(value: unknown) {
  return value === null || value === undefined ? null : stringValue(value);
}

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value: unknown) {
  return value === null || value === undefined ? null : numberValue(value);
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function dateValue(value: unknown) {
  const date = new Date(stringValue(value));

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function nullableDate(value: unknown) {
  return value === null || value === undefined ? null : dateValue(value);
}
