"use client";

import { AuditLogFilter } from "@paobom/domain";

import { useAuditLogsQuery } from "@/features/audit/presentation/react-query/useAuditLogsQuery";

export function useAuditLogs(filter: AuditLogFilter = {}) {
  const query = useAuditLogsQuery(filter);

  return {
    auditLogs: query.data ?? [],
    isLoading: query.isLoading,
  };
}
