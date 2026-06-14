import { PaymentMethod, SaleStatus } from "@paobom/domain";

export type SaleItemDTO = {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
};

export type SaleDTO = {
  id: string;
  created_at: string;
  customer_id: string | null;
  items: SaleItemDTO[];
  notes: string;
  paid_at: string | null;
  payment_method: PaymentMethod;
  status: SaleStatus;
  updated_at: string;
};
