import { PurchaseStatus } from "@paobom/domain";

export type PurchaseItemDTO = {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export type PurchaseDTO = {
  created_at: string;
  expected_date: string;
  id: string;
  items: PurchaseItemDTO[];
  notes: string;
  received_at: string | null;
  status: PurchaseStatus;
  supplier_id: string;
  updated_at: string;
};
