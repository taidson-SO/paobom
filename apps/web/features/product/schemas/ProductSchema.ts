import { z } from "zod";

export const ProductSchema = z.object({
  category: z.string().min(2),
  minimumStock: z.coerce.number().min(0),
  name: z.string().min(2),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  sku: z.string().min(2),
  unit: z.enum(["kg", "g", "unit", "liter", "package"]),
});
