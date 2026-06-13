"use client";

import { useMemo } from "react";

import { useFinanceUIStore } from "@/features/finance/presentation/stores/FinanceUIStore";

import { useFinanceMutations } from "../react-query/useFinanceMutations";
import {
  useCashEntriesQuery,
  useCashFlowSummaryQuery,
} from "../react-query/useFinanceQueries";

export function useFinance() {
  const entriesQuery = useCashEntriesQuery();
  const summaryQuery = useCashFlowSummaryQuery();
  const mutations = useFinanceMutations();
  const { selectedStatus, setSelectedStatus } = useFinanceUIStore();
  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const filteredEntries = useMemo(() => {
    if (selectedStatus === "all") {
      return entries;
    }

    return entries.filter((entry) => entry.status === selectedStatus);
  }, [entries, selectedStatus]);

  return {
    ...mutations,
    entries,
    filteredEntries,
    isLoading: entriesQuery.isLoading || summaryQuery.isLoading,
    selectedStatus,
    setSelectedStatus,
    summary: summaryQuery.data ?? {
      balance: 0,
      expense: 0,
      income: 0,
      pendingExpense: 0,
      pendingIncome: 0,
      projectedBalance: 0,
    },
  };
}
