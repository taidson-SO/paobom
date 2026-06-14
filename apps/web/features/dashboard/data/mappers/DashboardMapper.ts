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
      executive: {
        health_score: dashboard.executive.healthScore,
        inventory_loss_cost: dashboard.executive.inventoryLossCost,
        net_result: dashboard.executive.netResult,
        net_result_rate: dashboard.executive.netResultRate,
        operating_expenses: dashboard.executive.operatingExpenses,
        production_completion_rate:
          dashboard.executive.productionCompletionRate,
        purchase_receiving_rate: dashboard.executive.purchaseReceivingRate,
        status: dashboard.executive.status,
      },
      focus_areas: dashboard.focusAreas,
      generated_at: dashboard.generatedAt.toISOString(),
      inventory: {
        estimated_value: dashboard.inventory.estimatedValue,
        loss_cost: dashboard.inventory.lossCost,
        loss_movements: dashboard.inventory.lossMovements,
        products_below_minimum: dashboard.inventory.productsBelowMinimum,
        total_movements: dashboard.inventory.totalMovements,
      },
      operations: {
        cancelled_productions: dashboard.operations.cancelledProductions,
        completed_productions: dashboard.operations.completedProductions,
        open_purchases: dashboard.operations.openPurchases,
        production_orders: dashboard.operations.productionOrders,
        received_purchases: dashboard.operations.receivedPurchases,
      },
      period: {
        end_date: dashboard.period.endDate?.toISOString() ?? null,
        start_date: dashboard.period.startDate?.toISOString() ?? null,
      },
      sales: {
        average_ticket: dashboard.sales.averageTicket,
        cancelled_sales: dashboard.sales.cancelledSales,
        discount_total: dashboard.sales.discountTotal,
        gross_margin: dashboard.sales.grossMargin,
        gross_margin_rate: dashboard.sales.grossMarginRate,
        open_sales: dashboard.sales.openSales,
        paid_sales: dashboard.sales.paidSales,
        revenue: dashboard.sales.revenue,
      },
    };
  },
};
