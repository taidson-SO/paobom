export type ReportTableRowDTO = {
  amount: number;
  label: string;
  quantity: number;
};

export type BusinessReportsDTO = {
  cash_flow: {
    balance: number;
    by_status: ReportTableRowDTO[];
    by_type: ReportTableRowDTO[];
    projected_balance: number;
  };
  generated_at: string;
  period: {
    end_date: string | null;
    start_date: string | null;
  };
  inventory: {
    below_minimum: ReportTableRowDTO[];
    estimated_value: number;
    movements_by_type: ReportTableRowDTO[];
  };
  production: {
    average_unit_cost: number;
    orders_by_status: ReportTableRowDTO[];
    total_cost: number;
    total_produced: number;
  };
  purchases: {
    by_status: ReportTableRowDTO[];
    total_purchased: number;
  };
  sales: {
    by_payment_method: ReportTableRowDTO[];
    by_status: ReportTableRowDTO[];
    gross_margin: number;
    gross_margin_rate: number;
    low_margin_products: ReportTableRowDTO[];
    total_cost: number;
    total_revenue: number;
  };
};
