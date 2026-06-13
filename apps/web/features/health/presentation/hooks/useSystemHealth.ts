"use client";

import { useSystemHealthQuery } from "@/features/health/presentation/react-query/useSystemHealthQuery";
import { useHealthUIStore } from "@/features/health/presentation/stores/HealthUIStore";

export function useSystemHealth() {
  const query = useSystemHealthQuery();
  const detailsVisible = useHealthUIStore((state) => state.detailsVisible);
  const toggleDetails = useHealthUIStore((state) => state.toggleDetails);

  return {
    checkedAt: query.data?.checkedAt,
    detailsVisible,
    isLoading: query.isLoading,
    isOperational: query.data?.isOperational() ?? false,
    status: query.data?.status,
    toggleDetails,
  };
}
