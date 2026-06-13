import { z } from "zod";

export const CustomerInteractionSchema = z.object({
  customerId: z.string().min(1, "Cliente deve ser informado"),
  nextContactAt: z.coerce.date().optional().nullable(),
  notes: z.string().default(""),
  occurredAt: z.coerce.date(),
  subject: z.string().min(3, "Assunto deve ser informado"),
  type: z.enum(["order", "feedback", "complaint", "follow_up", "campaign"]),
});
