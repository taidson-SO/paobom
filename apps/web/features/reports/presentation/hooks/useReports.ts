"use client";

import { ReportsPeriodInput } from "@paobom/domain";

import { useReportsQuery } from "../react-query/useReportsQuery";

export function useReports(period: ReportsPeriodInput = {}) {
  const query = useReportsQuery(period);

  return {
    isLoading: query.isLoading,
    reports: query.data ?? null,
  };
}
