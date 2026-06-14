import { BusinessDashboard } from "@paobom/domain";

import { BusinessDashboardDTO } from "@/features/dashboard/data/dto/DashboardDTO";

export const DashboardMapper = {
  toDTO(dashboard: BusinessDashboard): BusinessDashboardDTO {
    return {
      alerts: dashboard.alerts,
      cash: {
        balance: dashboard.cash.balance,
        pending_expense: dashboard.cash.pendingExpense,
        pending_income: dashboard.cash.pendingIncome,
        projected_balance: dashboard.cash.projectedBalance,
      },
      generated_at: dashboard.generatedAt.toISOString(),
      inventory: {
        estimated_value: dashboard.inventory.estimatedValue,
        products_below_minimum: dashboard.inventory.productsBelowMinimum,
        total_movements: dashboard.inventory.totalMovements,
      },
      operations: {
        completed_productions: dashboard.operations.completedProductions,
        open_purchases: dashboard.operations.openPurchases,
        production_orders: dashboard.operations.productionOrders,
        received_purchases: dashboard.operations.receivedPurchases,
      },
      sales: {
        average_ticket: dashboard.sales.averageTicket,
        gross_margin: dashboard.sales.grossMargin,
        gross_margin_rate: dashboard.sales.grossMarginRate,
        open_sales: dashboard.sales.openSales,
        paid_sales: dashboard.sales.paidSales,
        revenue: dashboard.sales.revenue,
      },
    };
  },
};
