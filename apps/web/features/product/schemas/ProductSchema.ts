import { z } from "zod";

export const ProductSchema = z.object({
  category: z.string().min(2),
  kind: z.enum(["raw_material", "finished_product", "resale", "packaging"]),
  minimumStock: z.coerce.number().min(0),
  name: z.string().min(2),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  sku: z.string().min(2),
  unit: z.enum(["kg", "g", "ml", "unit", "liter", "package"]),
}).superRefine((product, context) => {
  if (
    (product.kind === "finished_product" || product.kind === "resale") &&
    product.salePrice <= 0
  ) {
    context.addIssue({
      code: "custom",
      message: "Preco de venda deve ser maior que zero",
      path: ["salePrice"],
    });
  }
});
