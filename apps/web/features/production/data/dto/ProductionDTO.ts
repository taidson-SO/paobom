import { ProductionOrderStatus } from "@paobom/domain";

export type RecipeIngredientDTO = {
  product_id: string;
  quantity: number;
};

export type RecipeDTO = {
  active: boolean;
  created_at: string;
  id: string;
  ingredients: RecipeIngredientDTO[];
  name: string;
  output_product_id: string;
  updated_at: string;
  yield_quantity: number;
};

export type ProductionConsumptionDTO = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export type ProductionOrderDTO = {
  completed_at: string | null;
  created_at: string;
  id: string;
  ingredient_consumptions: ProductionConsumptionDTO[];
  notes: string;
  output_product_id: string;
  quantity_produced: number;
  recipe_id: string;
  status: ProductionOrderStatus;
};
