"use client";

import { AuditLogFilter, ListAuditLogsUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { auditQueryKeys } from "./keys";

export function useAuditLogsQuery(filter: AuditLogFilter = {}) {
  const useCase = container.get<ListAuditLogsUseCase>(
    TOKENS.listAuditLogsUseCase,
  );
  const filterKey = {
    action: filter.action ?? "",
    endDate: filter.endDate?.toISOString() ?? null,
    entity: filter.entity ?? "",
    startDate: filter.startDate?.toISOString() ?? null,
    userId: filter.userId ?? "",
  };

  return useQuery({
    queryFn: () => useCase.execute(filter),
    queryKey: auditQueryKeys.logs(filterKey),
    refetchInterval: 3000,
  });
}
