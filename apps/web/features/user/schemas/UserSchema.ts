import { z } from "zod";

export const UserRoleSchema = z.enum([
  "owner",
  "manager",
  "cashier",
  "baker",
  "stock",
  "sales",
  "viewer",
]);

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(160),
  password: z.string().min(8).max(200),
  role: UserRoleSchema,
});

export const UpdateUserSchema = z.object({
  active: z.boolean(),
  email: z.string().email(),
  name: z.string().min(2).max(160),
  role: UserRoleSchema,
});

export const ResetUserPasswordSchema = z.object({
  password: z.string().min(8).max(200),
});
