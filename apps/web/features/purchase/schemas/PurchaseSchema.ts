import { z } from "zod";

export const PurchaseSchema = z.object({
  expectedDate: z.coerce.date(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitCost: z.coerce.number().min(0),
      }),
    )
    .min(1),
  notes: z.string(),
  supplierId: z.string().min(1),
});
