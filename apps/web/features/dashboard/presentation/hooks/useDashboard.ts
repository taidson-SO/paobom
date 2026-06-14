"use client";

import { useDashboardQuery } from "../react-query/useDashboardQuery";

export function useDashboard() {
  const query = useDashboardQuery();

  return {
    dashboard: query.data ?? null,
    isLoading: query.isLoading,
  };
}
