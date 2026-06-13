import { z } from "zod";

export const CustomerSchema = z.object({
  document: z.string(),
  email: z.string().email().or(z.literal("")),
  name: z.string().min(2),
  notes: z.string(),
  phone: z.string().min(8),
});
