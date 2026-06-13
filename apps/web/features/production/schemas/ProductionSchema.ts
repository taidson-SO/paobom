import { z } from "zod";

export const RecipeSchema = z.object({
  ingredients: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1),
  name: z.string().min(2),
  outputProductId: z.string().min(1),
  yieldQuantity: z.coerce.number().positive(),
});

export const ProductionOrderSchema = z.object({
  notes: z.string(),
  quantityProduced: z.coerce.number().positive(),
  recipeId: z.string().min(1),
});
