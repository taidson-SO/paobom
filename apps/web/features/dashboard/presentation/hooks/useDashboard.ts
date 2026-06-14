"use client";

import { DashboardPeriodInput } from "@paobom/domain";

import { useDashboardQuery } from "../react-query/useDashboardQuery";

export function useDashboard(period: DashboardPeriodInput = {}) {
  const query = useDashboardQuery(period);

  return {
    dashboard: query.data ?? null,
    isLoading: query.isLoading,
  };
}
