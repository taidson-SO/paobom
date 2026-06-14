import { z } from "zod";

export const SaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produto deve ser informado"),
        quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
        unitPrice: z.coerce.number().nonnegative("Preco nao pode ser negativo"),
      }),
    )
    .min(1, "Venda deve possuir pelo menos um item"),
  notes: z.string().default(""),
  paymentMethod: z.enum(["cash", "card", "pix", "invoice"]),
});
