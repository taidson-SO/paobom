import { ProductKind, ProductUnit } from "@paobom/domain";

export type ProductDTO = {
  active: boolean;
  category: string;
  created_at: string;
  id: string;
  kind: ProductKind;
  minimum_stock: number;
  name: string;
  purchase_price: number;
  sale_price: number;
  sku: string;
  unit: ProductUnit;
  updated_at: string;
};
