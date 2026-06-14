import { DashboardAlertLevel } from "@paobom/domain";

export type DashboardAlertDTO = {
  id: string;
  description: string;
  level: DashboardAlertLevel;
  title: string;
};

export type BusinessDashboardDTO = {
  alerts: DashboardAlertDTO[];
  cash: {
    balance: number;
    pending_expense: number;
    pending_income: number;
    projected_balance: number;
  };
  generated_at: string;
  inventory: {
    estimated_value: number;
    products_below_minimum: number;
    total_movements: number;
  };
  operations: {
    completed_productions: number;
    open_purchases: number;
    production_orders: number;
    received_purchases: number;
  };
  sales: {
    average_ticket: number;
    gross_margin: number;
    gross_margin_rate: number;
    open_sales: number;
    paid_sales: number;
    revenue: number;
  };
};
