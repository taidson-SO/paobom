"use client";

import { AuditActionResult } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";
import { usePermissionSession } from "@/core/permissions/permission-session";

type RecordAuditInput = {
  action: string;
  description: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  result?: AuditActionResult;
};

export function useAuditRecorder() {
  const { currentUser } = usePermissionSession();

  return {
    recordAudit(input: RecordAuditInput) {
      eventBus.emit("audit:record-requested", {
        action: input.action,
        description: input.description,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
        result: input.result ?? "success",
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
      });
    },
  };
}
