import { z } from "zod";

export const CashEntrySchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  category: z.string().min(2, "Categoria deve ser informada"),
  description: z.string().min(3, "Descricao deve ser informada"),
  dueDate: z.coerce.date(),
  referenceId: z.string().optional().nullable(),
  type: z.enum(["income", "expense"]),
});
