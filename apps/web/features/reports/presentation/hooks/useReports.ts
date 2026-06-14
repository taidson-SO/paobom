"use client";

import { useReportsQuery } from "../react-query/useReportsQuery";

export function useReports() {
  const query = useReportsQuery();

  return {
    isLoading: query.isLoading,
    reports: query.data ?? null,
  };
}
