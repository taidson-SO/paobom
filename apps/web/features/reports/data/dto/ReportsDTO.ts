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
  inventory: {
    below_minimum: ReportTableRowDTO[];
    estimated_value: number;
    movements_by_type: ReportTableRowDTO[];
  };
  production: {
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
    total_revenue: number;
  };
};
