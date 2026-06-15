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

export const CashRegisterMovementSchema = z.object({
  actor: z.string().min(2, "Responsavel pela movimentacao deve ser informado"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  cashRegisterId: z.string().min(1, "Caixa deve ser informado"),
  reason: z.string().min(3, "Motivo deve ser informado"),
  type: z.enum(["supply", "withdrawal"]),
});

export const CashReconciliationSchema = z.object({
  cashRegisterId: z.string().min(1, "Caixa deve ser informado"),
  countedAmount: z.coerce.number().min(0, "Valor contado nao pode ser negativo"),
  expectedAmount: z.coerce.number().min(0, "Valor esperado nao pode ser negativo"),
  method: z.string().min(2, "Forma de pagamento deve ser informada"),
  notes: z.string().optional().nullable(),
  reconciledBy: z.string().min(2, "Responsavel pela conciliacao deve ser informado"),
}).superRefine((input, context) => {
  if (
    Math.abs(input.countedAmount - input.expectedAmount) > 0.01 &&
    !input.notes?.trim()
  ) {
    context.addIssue({
      code: "custom",
      message: "Conciliacao com divergencia exige observacao",
      path: ["notes"],
    });
  }
});
