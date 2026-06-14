import { z } from "zod";

export const CashEntrySchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  category: z.string().min(2, "Categoria deve ser informada"),
  description: z.string().min(3, "Descricao deve ser informada"),
  dueDate: z.coerce.date(),
  referenceId: z.string().optional().nullable(),
  type: z.enum(["income", "expense"]),
});

export const OpenCashRegisterSchema = z.object({
  openedBy: z.string().min(2, "Responsavel pela abertura deve ser informado"),
  openingAmount: z.coerce.number().min(0, "Valor inicial nao pode ser negativo"),
});

export const CloseCashRegisterSchema = z.object({
  cashRegisterId: z.string().min(1, "Caixa deve ser informado"),
  closedBy: z.string().min(2, "Responsavel pelo fechamento deve ser informado"),
  closingNote: z.string().optional().nullable(),
  countedAmount: z.coerce.number().min(0, "Valor contado nao pode ser negativo"),
});
