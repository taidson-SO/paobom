import { CashFlowRepository } from "./finance";
import { InventoryRepository } from "./inventory";
import { ProductionOrderRepository } from "./production";
import { PurchaseRepository } from "./purchase";
import { SaleRepository } from "./sales";

export type DashboardAlertLevel = "info" | "warning" | "critical";

export type DashboardAlert = {
  id: string;
  level: DashboardAlertLevel;
  title: string;
  description: string;
};

export type DashboardFocusPriority = "high" | "medium" | "low";

export type DashboardFocusArea = {
  id: string;
  priority: DashboardFocusPriority;
  title: string;
  description: string;
  metric: string;
};

export type DashboardHealthStatus = "healthy" | "attention" | "critical";

export type DashboardPeriodInput = {
  startDate?: Date | null;
  endDate?: Date | null;
};

export type DashboardPeriod = {
  startDate: Date | null;
  endDate: Date | null;
};

export type BusinessDashboard = {
  generatedAt: Date;
  period: DashboardPeriod;
  executive: {
    healthScore: number;
    status: DashboardHealthStatus;
    netResult: number;
    netResultRate: number;
    operatingExpenses: number;
    inventoryLossCost: number;
    productionCompletionRate: number;
    purchaseReceivingRate: number;
  };
  sales: {
    paidSales: number;
    openSales: number;
    cancelledSales: number;
    revenue: number;
    grossMargin: number;
    grossMarginRate: number;
    averageTicket: number;
    discountTotal: number;
  };
  cash: {
    balance: number;
    projectedBalance: number;
    pendingIncome: number;
    pendingExpense: number;
  };
  inventory: {
    estimatedValue: number;
    productsBelowMinimum: number;
    totalMovements: number;
    lossMovements: number;
    lossCost: number;
  };
  operations: {
    openPurchases: number;
    receivedPurchases: number;
    productionOrders: number;
    completedProductions: number;
    cancelledProductions: number;
  };
  alerts: DashboardAlert[];
  focusAreas: DashboardFocusArea[];
};

export class GetBusinessDashboardUseCase {
  constructor(
    private readonly sales: SaleRepository,
    private readonly cashFlow: CashFlowRepository,
    private readonly inventory: InventoryRepository,
    private readonly purchases: PurchaseRepository,
    private readonly productions: ProductionOrderRepository,
  ) {}

  async execute(input: DashboardPeriodInput = {}): Promise<BusinessDashboard> {
    const period = normalizeDashboardPeriod(input);
    const [sales, cashEntries, balances, movements, purchases, productions] =
      await Promise.all([
        this.sales.findAll(),
        this.cashFlow.findAll(),
        this.inventory.findBalances(),
        this.inventory.findMovements(),
        this.purchases.findAll(),
        this.productions.findAll(),
      ]);
    const periodSales = sales.filter((sale) =>
      isWithinPeriod(sale.paidAt ?? sale.createdAt, period),
    );
    const periodCashEntries = cashEntries.filter((entry) =>
      isWithinPeriod(entry.settledAt ?? entry.dueDate, period),
    );
    const periodMovements = movements.filter((movement) =>
      isWithinPeriod(movement.occurredAt, period),
    );
    const periodPurchases = purchases.filter((purchase) =>
      isWithinPeriod(purchase.receivedAt ?? purchase.expectedDate, period),
    );
    const periodProductions = productions.filter((production) =>
      isWithinPeriod(
        production.completedAt ?? production.startedAt ?? production.createdAt,
        period,
      ),
    );
    const paidSales = periodSales.filter((sale) => sale.status === "paid");
    const openSales = periodSales.filter((sale) => sale.status === "open");
    const cancelledSales = periodSales.filter(
      (sale) => sale.status === "cancelled",
    );
    const activeCashEntries = periodCashEntries.filter(
      (entry) => entry.status !== "cancelled",
    );
    const receivedPurchases = periodPurchases.filter(
      (purchase) => purchase.status === "received",
    );
    const openPurchases = periodPurchases.filter(
      (purchase) => purchase.status === "ordered",
    );
    const completedProductions = periodProductions.filter(
      (production) => production.status === "finished",
    );
    const cancelledProductions = periodProductions.filter(
      (production) => production.status === "cancelled",
    );
    const revenue = paidSales.reduce((sum, sale) => sum + sale.total, 0);
    const grossMargin = paidSales.reduce(
      (sum, sale) => sum + sale.grossMargin,
      0,
    );
    const grossMarginRate = revenue > 0 ? grossMargin / revenue : 0;
    const operatingExpenses = activeCashEntries.reduce(
      (sum, entry) =>
        entry.type === "expense" && entry.status === "settled"
          ? sum + entry.amount
          : sum,
      0,
    );
    const inventoryLossCost = periodMovements.reduce(
      (sum, movement) =>
        movement.type === "loss"
          ? sum + movement.quantity * movement.unitCost
          : sum,
      0,
    );
    const netResult = grossMargin - operatingExpenses - inventoryLossCost;
    const netResultRate = revenue > 0 ? netResult / revenue : 0;
    const productionCompletionRate =
      periodProductions.length > 0
        ? completedProductions.length / periodProductions.length
        : 1;
    const purchaseReceivingRate =
      periodPurchases.length > 0
        ? receivedPurchases.length / periodPurchases.length
        : 1;
    const cash = activeCashEntries.reduce(
      (summary, entry) => {
        const signedAmount = entry.type === "income" ? entry.amount : -entry.amount;

        if (entry.status === "settled") {
          return {
            ...summary,
            balance: summary.balance + signedAmount,
            projectedBalance: summary.projectedBalance + signedAmount,
          };
        }

        return {
          balance: summary.balance,
          pendingExpense:
            entry.type === "expense"
              ? summary.pendingExpense + entry.amount
              : summary.pendingExpense,
          pendingIncome:
            entry.type === "income"
              ? summary.pendingIncome + entry.amount
              : summary.pendingIncome,
          projectedBalance: summary.projectedBalance + signedAmount,
        };
      },
      {
        balance: 0,
        pendingExpense: 0,
        pendingIncome: 0,
        projectedBalance: 0,
      },
    );
    const inventory = {
      estimatedValue: balances.reduce(
        (sum, balance) => sum + balance.estimatedValue,
        0,
      ),
      lossCost: inventoryLossCost,
      lossMovements: periodMovements.filter((movement) => movement.type === "loss")
        .length,
      productsBelowMinimum: balances.filter((balance) => balance.isBelowMinimum)
        .length,
      totalMovements: periodMovements.length,
    };
    const executive = {
      healthScore: calculateHealthScore({
        cashProjectedBalance: cash.projectedBalance,
        grossMarginRate,
        inventoryLossCost,
        netResultRate,
        openPurchases: openPurchases.length,
        productsBelowMinimum: inventory.productsBelowMinimum,
        productionCompletionRate,
        purchaseReceivingRate,
        revenue,
      }),
      inventoryLossCost,
      netResult,
      netResultRate,
      operatingExpenses,
      productionCompletionRate,
      purchaseReceivingRate,
      status: "healthy" as DashboardHealthStatus,
    };
    executive.status = getHealthStatus(executive.healthScore);
    const dashboard: BusinessDashboard = {
      alerts: [],
      cash,
      executive,
      focusAreas: [],
      generatedAt: new Date(),
      inventory,
      operations: {
        completedProductions: completedProductions.length,
        cancelledProductions: cancelledProductions.length,
        openPurchases: openPurchases.length,
        productionOrders: periodProductions.length,
        receivedPurchases: receivedPurchases.length,
      },
      period,
      sales: {
        averageTicket: paidSales.length ? revenue / paidSales.length : 0,
        cancelledSales: cancelledSales.length,
        discountTotal: paidSales.reduce(
          (sum, sale) => sum + sale.discountAmount,
          0,
        ),
        grossMargin,
        grossMarginRate,
        openSales: openSales.length,
        paidSales: paidSales.length,
        revenue,
      },
    };

    return {
      ...dashboard,
      alerts: buildAlerts(dashboard),
      focusAreas: buildFocusAreas(dashboard),
    };
  }
}

function normalizeDashboardPeriod(input: DashboardPeriodInput): DashboardPeriod {
  const startDate = input.startDate ? startOfDay(input.startDate) : null;
  const endDate = input.endDate ? endOfDay(input.endDate) : null;

  if (startDate && endDate && startDate > endDate) {
    throw new Error("Data inicial do dashboard deve ser menor ou igual a data final");
  }

  return {
    endDate,
    startDate,
  };
}

function startOfDay(date: Date) {
  const normalized = new Date(date);

  normalized.setHours(0, 0, 0, 0);

  return normalized;
}

function endOfDay(date: Date) {
  const normalized = new Date(date);

  normalized.setHours(23, 59, 59, 999);

  return normalized;
}

function isWithinPeriod(date: Date, period: DashboardPeriod) {
  if (period.startDate && date < period.startDate) {
    return false;
  }

  if (period.endDate && date > period.endDate) {
    return false;
  }

  return true;
}

function calculateHealthScore(input: {
  cashProjectedBalance: number;
  grossMarginRate: number;
  inventoryLossCost: number;
  netResultRate: number;
  openPurchases: number;
  productsBelowMinimum: number;
  productionCompletionRate: number;
  purchaseReceivingRate: number;
  revenue: number;
}) {
  let score = 100;

  if (input.revenue === 0) {
    score -= 15;
  }

  if (input.netResultRate < 0) {
    score -= 25;
  } else if (input.netResultRate < 0.1) {
    score -= 12;
  }

  if (input.grossMarginRate < 0.2 && input.revenue > 0) {
    score -= 15;
  }

  if (input.cashProjectedBalance < 0) {
    score -= 20;
  }

  if (input.productsBelowMinimum > 0) {
    score -= Math.min(15, input.productsBelowMinimum * 3);
  }

  if (input.inventoryLossCost > 0) {
    score -= 8;
  }

  if (input.productionCompletionRate < 0.75) {
    score -= 8;
  }

  if (input.purchaseReceivingRate < 0.75 || input.openPurchases > 0) {
    score -= 7;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHealthStatus(score: number): DashboardHealthStatus {
  if (score < 55) {
    return "critical";
  }

  if (score < 75) {
    return "attention";
  }

  return "healthy";
}

function buildAlerts(
  dashboard: Omit<BusinessDashboard, "alerts" | "focusAreas">,
) {
  const alerts: DashboardAlert[] = [];

  if (dashboard.inventory.productsBelowMinimum > 0) {
    alerts.push({
      description: `${dashboard.inventory.productsBelowMinimum} produto(s) abaixo do estoque minimo.`,
      id: "inventory-below-minimum",
      level: "warning",
      title: "Estoque baixo",
    });
  }

  if (dashboard.cash.projectedBalance < 0) {
    alerts.push({
      description: "O saldo projetado esta negativo considerando pendencias.",
      id: "negative-projected-balance",
      level: "critical",
      title: "Caixa projetado negativo",
    });
  }

  if (dashboard.executive.netResult < 0) {
    alerts.push({
      description: "O resultado liquido do periodo ficou negativo apos despesas e perdas.",
      id: "negative-net-result",
      level: "critical",
      title: "Resultado negativo",
    });
  }

  if (dashboard.sales.openSales > 0) {
    alerts.push({
      description: `${dashboard.sales.openSales} venda(s) a prazo aguardando recebimento.`,
      id: "open-sales",
      level: "info",
      title: "Recebimentos pendentes",
    });
  }

  if (dashboard.sales.revenue > 0 && dashboard.sales.grossMarginRate < 0.2) {
    alerts.push({
      description: `Margem bruta em ${(dashboard.sales.grossMarginRate * 100).toFixed(1)}%. Revise custos e precos.`,
      id: "low-gross-margin",
      level: "warning",
      title: "Margem baixa",
    });
  }

  if (dashboard.inventory.lossCost > 0) {
    alerts.push({
      description: `Perdas estimadas em R$ ${dashboard.inventory.lossCost.toFixed(2)} no periodo.`,
      id: "inventory-losses",
      level: "warning",
      title: "Perdas registradas",
    });
  }

  if (dashboard.operations.openPurchases > 0) {
    alerts.push({
      description: `${dashboard.operations.openPurchases} compra(s) aguardando recebimento.`,
      id: "open-purchases",
      level: "info",
      title: "Compras em aberto",
    });
  }

  return alerts;
}

function buildFocusAreas(
  dashboard: Omit<BusinessDashboard, "alerts" | "focusAreas">,
) {
  const focusAreas: DashboardFocusArea[] = [];

  if (dashboard.executive.netResultRate < 0.1) {
    focusAreas.push({
      description: "Revisar precos, custos de insumos e despesas baixadas no periodo.",
      id: "profitability",
      metric: `${(dashboard.executive.netResultRate * 100).toFixed(1)}%`,
      priority: dashboard.executive.netResult < 0 ? "high" : "medium",
      title: "Recuperar lucratividade",
    });
  }

  if (dashboard.cash.projectedBalance < dashboard.cash.balance) {
    focusAreas.push({
      description: "Priorizar recebimentos pendentes e renegociar saidas proximas.",
      id: "cash-projection",
      metric: `R$ ${dashboard.cash.projectedBalance.toFixed(2)}`,
      priority: dashboard.cash.projectedBalance < 0 ? "high" : "medium",
      title: "Proteger caixa projetado",
    });
  }

  if (dashboard.inventory.productsBelowMinimum > 0) {
    focusAreas.push({
      description: "Planejar reposicao dos itens criticos antes do proximo ciclo produtivo.",
      id: "inventory-coverage",
      metric: `${dashboard.inventory.productsBelowMinimum} item(ns)`,
      priority: "high",
      title: "Evitar ruptura de estoque",
    });
  }

  if (dashboard.inventory.lossCost > 0) {
    focusAreas.push({
      description: "Mapear origem das perdas e ajustar producao, validade ou armazenamento.",
      id: "inventory-loss",
      metric: `R$ ${dashboard.inventory.lossCost.toFixed(2)}`,
      priority: "medium",
      title: "Reduzir perdas",
    });
  }

  if (dashboard.operations.openPurchases > 0) {
    focusAreas.push({
      description: "Acompanhar fornecedores com pedidos em aberto para manter a producao.",
      id: "supplier-follow-up",
      metric: `${dashboard.operations.openPurchases} compra(s)`,
      priority: "low",
      title: "Acelerar recebimentos",
    });
  }

  return focusAreas.slice(0, 4);
}
