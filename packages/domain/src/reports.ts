import { CashEntryStatus, CashEntryType, CashFlowRepository } from "./finance";
import { InventoryRepository, StockMovementType } from "./inventory";
import { ProductionOrderRepository } from "./production";
import { PurchaseRepository, PurchaseStatus } from "./purchase";
import { PaymentMethod, SaleRepository, SaleStatus } from "./sales";

export type ReportMetric = {
  label: string;
  value: number;
};

export type ReportTableRow = {
  label: string;
  quantity: number;
  amount: number;
};

export type BusinessReports = {
  generatedAt: Date;
  sales: {
    totalRevenue: number;
    grossMargin: number;
    byStatus: ReportTableRow[];
    byPaymentMethod: ReportTableRow[];
  };
  cashFlow: {
    balance: number;
    projectedBalance: number;
    byType: ReportTableRow[];
    byStatus: ReportTableRow[];
  };
  inventory: {
    estimatedValue: number;
    belowMinimum: ReportTableRow[];
    movementsByType: ReportTableRow[];
  };
  purchases: {
    totalPurchased: number;
    byStatus: ReportTableRow[];
  };
  production: {
    totalProduced: number;
    totalCost: number;
    ordersByStatus: ReportTableRow[];
  };
};

export class GetBusinessReportsUseCase {
  constructor(
    private readonly sales: SaleRepository,
    private readonly cashFlow: CashFlowRepository,
    private readonly inventory: InventoryRepository,
    private readonly purchases: PurchaseRepository,
    private readonly productions: ProductionOrderRepository,
  ) {}

  async execute(): Promise<BusinessReports> {
    const [sales, cashEntries, balances, movements, purchases, productions] =
      await Promise.all([
        this.sales.findAll(),
        this.cashFlow.findAll(),
        this.inventory.findBalances(),
        this.inventory.findMovements(),
        this.purchases.findAll(),
        this.productions.findAll(),
      ]);
    const activeCashEntries = cashEntries.filter(
      (entry) => entry.status !== "cancelled",
    );

    return {
      cashFlow: {
        balance: activeCashEntries.reduce((sum, entry) => {
          if (entry.status !== "settled") {
            return sum;
          }

          return sum + signedCashAmount(entry.type, entry.amount);
        }, 0),
        byStatus: summarizeCashStatus(cashEntries),
        byType: summarizeCashType(activeCashEntries),
        projectedBalance: activeCashEntries.reduce(
          (sum, entry) => sum + signedCashAmount(entry.type, entry.amount),
          0,
        ),
      },
      generatedAt: new Date(),
      inventory: {
        belowMinimum: balances
          .filter((balance) => balance.isBelowMinimum)
          .map((balance) => ({
            amount: balance.estimatedValue,
            label: balance.productId,
            quantity: balance.quantity,
          })),
        estimatedValue: balances.reduce(
          (sum, balance) => sum + balance.estimatedValue,
          0,
        ),
        movementsByType: summarizeMovementsByType(movements),
      },
      production: {
        ordersByStatus: summarizeProductionsByStatus(productions),
        totalCost: productions
          .filter((production) => production.status === "finished")
          .reduce(
          (sum, production) => sum + production.totalCost,
          0,
        ),
        totalProduced: productions
          .filter((production) => production.status === "finished")
          .reduce(
          (sum, production) => sum + production.quantityProduced,
          0,
        ),
      },
      purchases: {
        byStatus: summarizePurchasesByStatus(purchases),
        totalPurchased: purchases.reduce(
          (sum, purchase) =>
            purchase.status === "cancelled" ? sum : sum + purchase.total,
          0,
        ),
      },
      sales: {
        byPaymentMethod: summarizeSalesByPayment(sales),
        byStatus: summarizeSalesByStatus(sales),
        grossMargin: sales.reduce(
          (sum, sale) => (sale.status === "paid" ? sum + sale.grossMargin : sum),
          0,
        ),
        totalRevenue: sales.reduce(
          (sum, sale) => (sale.status === "paid" ? sum + sale.total : sum),
          0,
        ),
      },
    };
  }
}

function signedCashAmount(type: CashEntryType, amount: number) {
  return type === "income" ? amount : -amount;
}

function summarizeCashStatus(
  entries: Awaited<ReturnType<CashFlowRepository["findAll"]>>,
) {
  const labels: Record<CashEntryStatus, string> = {
    cancelled: "Cancelado",
    pending: "Pendente",
    settled: "Baixado",
  };

  return summarizeBy(entries, (entry) => entry.status, labels);
}

function summarizeCashType(
  entries: Awaited<ReturnType<CashFlowRepository["findAll"]>>,
) {
  const labels: Record<CashEntryType, string> = {
    expense: "Saidas",
    income: "Entradas",
  };

  return summarizeBy(entries, (entry) => entry.type, labels);
}

function summarizeMovementsByType(
  movements: Awaited<ReturnType<InventoryRepository["findMovements"]>>,
) {
  const labels: Record<StockMovementType, string> = {
    adjustment: "Ajustes",
    loss: "Perdas",
    production_in: "Entrada producao",
    production_out: "Consumo producao",
    production_reversal: "Estorno producao",
    purchase_in: "Entrada compra",
    purchase_reversal: "Estorno compra",
    sale_out: "Saida venda",
  };

  return summarizeBy(movements, (movement) => movement.type, labels);
}

function summarizeProductionsByStatus(
  productions: Awaited<ReturnType<ProductionOrderRepository["findAll"]>>,
) {
  return summarizeBy(
    productions,
    (production) => production.status,
    {
      cancelled: "Cancelada",
      finished: "Finalizada",
      planned: "Planejada",
      started: "Iniciada",
    },
    (production) => production.totalCost,
  );
}

function summarizePurchasesByStatus(
  purchases: Awaited<ReturnType<PurchaseRepository["findAll"]>>,
) {
  const labels: Record<PurchaseStatus, string> = {
    cancelled: "Cancelada",
    draft: "Rascunho",
    ordered: "Pedido",
    received: "Recebida",
  };

  return summarizeBy(purchases, (purchase) => purchase.status, labels);
}

function summarizeSalesByPayment(
  sales: Awaited<ReturnType<SaleRepository["findAll"]>>,
) {
  const labels: Record<PaymentMethod, string> = {
    card: "Cartao",
    cash: "Dinheiro",
    invoice: "A prazo",
    pix: "Pix",
  };

  return summarizeBy(sales, (sale) => sale.paymentMethod, labels);
}

function summarizeSalesByStatus(
  sales: Awaited<ReturnType<SaleRepository["findAll"]>>,
) {
  const labels: Record<SaleStatus, string> = {
    cancelled: "Cancelada",
    open: "Aberta",
    paid: "Paga",
  };

  return summarizeBy(sales, (sale) => sale.status, labels);
}

function summarizeBy<TItem, TKey extends string>(
  items: TItem[],
  getKey: (item: TItem) => TKey,
  labels: Record<TKey, string>,
  getAmount: (item: TItem) => number = getDefaultAmount,
) {
  const summary = new Map<TKey, ReportTableRow>();

  items.forEach((item) => {
    const key = getKey(item);
    const current = summary.get(key) ?? {
      amount: 0,
      label: labels[key],
      quantity: 0,
    };

    summary.set(key, {
      ...current,
      amount: current.amount + getAmount(item),
      quantity: current.quantity + 1,
    });
  });

  return Object.keys(labels).map((key) => {
    const typedKey = key as TKey;

    return (
      summary.get(typedKey) ?? {
        amount: 0,
        label: labels[typedKey],
        quantity: 0,
      }
    );
  });
}

function getDefaultAmount<TItem>(item: TItem) {
  const record = item as Record<string, unknown>;

  if (typeof record.total === "number") {
    return record.total;
  }

  if (typeof record.amount === "number") {
    return record.amount;
  }

  return 0;
}
