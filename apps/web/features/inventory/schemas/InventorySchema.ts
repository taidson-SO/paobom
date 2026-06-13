import { z } from "zod";

export const RegisterLossSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reason: z.string().min(2),
});

export const RegisterAdjustmentSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reason: z.string().min(2),
});
