import { BusinessReports } from "@paobom/domain";

import { BusinessReportsDTO } from "@/features/reports/data/dto/ReportsDTO";

export const ReportsMapper = {
  toDTO(reports: BusinessReports): BusinessReportsDTO {
    return {
      cash_flow: {
        balance: reports.cashFlow.balance,
        by_status: reports.cashFlow.byStatus,
        by_type: reports.cashFlow.byType,
        projected_balance: reports.cashFlow.projectedBalance,
      },
      generated_at: reports.generatedAt.toISOString(),
      inventory: {
        below_minimum: reports.inventory.belowMinimum,
        estimated_value: reports.inventory.estimatedValue,
        movements_by_type: reports.inventory.movementsByType,
      },
      production: {
        average_unit_cost: reports.production.averageUnitCost,
        orders_by_status: reports.production.ordersByStatus,
        total_cost: reports.production.totalCost,
        total_produced: reports.production.totalProduced,
      },
      purchases: {
        by_status: reports.purchases.byStatus,
        total_purchased: reports.purchases.totalPurchased,
      },
      sales: {
        by_payment_method: reports.sales.byPaymentMethod,
        by_status: reports.sales.byStatus,
        gross_margin: reports.sales.grossMargin,
        gross_margin_rate: reports.sales.grossMarginRate,
        low_margin_products: reports.sales.lowMarginProducts,
        total_cost: reports.sales.totalCost,
        total_revenue: reports.sales.totalRevenue,
      },
    };
  },
};
