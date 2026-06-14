import { AuditActionResult } from "@paobom/domain";

export type AuditLogDTO = {
  action: string;
  description: string;
  entity: string;
  entity_id: string | null;
  id: string;
  metadata: Record<string, string | number | boolean | null>;
  occurred_at: string;
  result: AuditActionResult;
  user_id: string;
  user_name: string;
  user_role: string;
};
