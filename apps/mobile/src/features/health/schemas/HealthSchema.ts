import { z } from "zod";

export const HealthSchema = z.object({
  checkedAt: z.date(),
  status: z.enum(["operational", "degraded", "offline"]),
});
