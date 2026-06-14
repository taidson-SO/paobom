import {
  DashboardAlertLevel,
  DashboardFocusPriority,
  DashboardHealthStatus,
} from "@paobom/domain";

export type DashboardAlertDTO = {
  id: string;
  description: string;
  level: DashboardAlertLevel;
  title: string;
};

export type DashboardFocusAreaDTO = {
  description: string;
  id: string;
  metric: string;
  priority: DashboardFocusPriority;
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
  executive: {
    health_score: number;
    inventory_loss_cost: number;
    net_result: number;
    net_result_rate: number;
    operating_expenses: number;
    production_completion_rate: number;
    purchase_receiving_rate: number;
    status: DashboardHealthStatus;
  };
  focus_areas: DashboardFocusAreaDTO[];
  generated_at: string;
  inventory: {
    estimated_value: number;
    loss_cost: number;
    loss_movements: number;
    products_below_minimum: number;
    total_movements: number;
  };
  operations: {
    cancelled_productions: number;
    completed_productions: number;
    open_purchases: number;
    production_orders: number;
    received_purchases: number;
  };
  period: {
    end_date: string | null;
    start_date: string | null;
  };
  sales: {
    average_ticket: number;
    cancelled_sales: number;
    discount_total: number;
    gross_margin: number;
    gross_margin_rate: number;
    open_sales: number;
    paid_sales: number;
    revenue: number;
  };
};
