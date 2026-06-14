import { z } from "zod";

export const SaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  discountAmount: z.coerce.number().min(0).default(0),
  discountAuthorizedBy: z.string().optional().nullable(),
  discountReason: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produto deve ser informado"),
        quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
        unitPrice: z.coerce.number().positive("Preco deve ser maior que zero"),
      }),
    )
    .min(1, "Venda deve possuir pelo menos um item"),
  notes: z.string().default(""),
  oversellApprovedBy: z.string().optional().nullable(),
  oversellJustification: z.string().optional().nullable(),
  paymentMethod: z.enum(["cash", "card", "pix", "invoice"]),
}).superRefine((sale, context) => {
  const subtotal = sale.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  if (sale.discountAmount > subtotal) {
    context.addIssue({
      code: "custom",
      message: "Desconto nao pode superar o subtotal",
      path: ["discountAmount"],
    });
  }

  if (subtotal > 0 && sale.discountAmount / subtotal > 0.1) {
    if (!sale.discountAuthorizedBy?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Desconto acima do limite exige responsavel",
        path: ["discountAuthorizedBy"],
      });
    }

    if (!sale.discountReason?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Desconto acima do limite exige justificativa",
        path: ["discountReason"],
      });
    }
  }
});
