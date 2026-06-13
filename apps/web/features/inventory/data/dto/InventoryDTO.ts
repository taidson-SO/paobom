import { StockMovementType } from "@paobom/domain";

export type InventoryBalanceDTO = {
  average_cost: number;
  minimum_stock: number;
  product_id: string;
  quantity: number;
};

export type StockMovementDTO = {
  id: string;
  occurred_at: string;
  product_id: string;
  quantity: number;
  reason: string;
  reference_id: string | null;
  type: StockMovementType;
  unit_cost: number;
};
