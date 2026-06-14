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

export type BusinessDashboard = {
  generatedAt: Date;
  sales: {
    paidSales: number;
    openSales: number;
    revenue: number;
    grossMargin: number;
    averageTicket: number;
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
  };
  operations: {
    openPurchases: number;
    receivedPurchases: number;
    productionOrders: number;
    completedProductions: number;
  };
  alerts: DashboardAlert[];
};

export class GetBusinessDashboardUseCase {
  constructor(
    private readonly sales: SaleRepository,
    private readonly cashFlow: CashFlowRepository,
    private readonly inventory: InventoryRepository,
    private readonly purchases: PurchaseRepository,
    private readonly productions: ProductionOrderRepository,
  ) {}

  async execute(): Promise<BusinessDashboard> {
    const [sales, cashEntries, balances, movements, purchases, productions] =
      await Promise.all([
        this.sales.findAll(),
        this.cashFlow.findAll(),
        this.inventory.findBalances(),
        this.inventory.findMovements(),
        this.purchases.findAll(),
        this.productions.findAll(),
      ]);
    const paidSales = sales.filter((sale) => sale.status === "paid");
    const openSales = sales.filter((sale) => sale.status === "open");
    const activeCashEntries = cashEntries.filter(
      (entry) => entry.status !== "cancelled",
    );
    const receivedPurchases = purchases.filter(
      (purchase) => purchase.status === "received",
    );
    const openPurchases = purchases.filter(
      (purchase) => purchase.status === "ordered",
    );
    const completedProductions = productions.filter(
      (production) => production.status === "completed",
    );
    const revenue = paidSales.reduce((sum, sale) => sum + sale.total, 0);
    const grossMargin = paidSales.reduce(
      (sum, sale) => sum + sale.grossMargin,
      0,
    );
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
      productsBelowMinimum: balances.filter((balance) => balance.isBelowMinimum)
        .length,
      totalMovements: movements.length,
    };
    const dashboard: BusinessDashboard = {
      alerts: [],
      cash,
      generatedAt: new Date(),
      inventory,
      operations: {
        completedProductions: completedProductions.length,
        openPurchases: openPurchases.length,
        productionOrders: productions.length,
        receivedPurchases: receivedPurchases.length,
      },
      sales: {
        averageTicket: paidSales.length ? revenue / paidSales.length : 0,
        grossMargin,
        openSales: openSales.length,
        paidSales: paidSales.length,
        revenue,
      },
    };

    return {
      ...dashboard,
      alerts: buildAlerts(dashboard),
    };
  }
}

function buildAlerts(dashboard: Omit<BusinessDashboard, "alerts">) {
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

  if (dashboard.sales.openSales > 0) {
    alerts.push({
      description: `${dashboard.sales.openSales} venda(s) a prazo aguardando recebimento.`,
      id: "open-sales",
      level: "info",
      title: "Recebimentos pendentes",
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
