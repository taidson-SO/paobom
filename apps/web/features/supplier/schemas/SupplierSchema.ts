import { z } from "zod";

export const SupplierSchema = z.object({
  contactName: z.string().min(2),
  document: z.string().min(3),
  email: z.string().email().or(z.literal("")),
  name: z.string().min(2),
  phone: z.string().min(8),
});
