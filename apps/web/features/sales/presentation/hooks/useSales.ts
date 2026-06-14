"use client";

import { useMemo } from "react";

import { useSalesUIStore } from "@/features/sales/presentation/stores/SalesUIStore";

import { useSalesMutations } from "../react-query/useSalesMutations";
import { useSalesQuery } from "../react-query/useSalesQuery";

export function useSales() {
  const query = useSalesQuery();
  const mutations = useSalesMutations();
  const { selectedStatus, setSelectedStatus } = useSalesUIStore();
  const sales = useMemo(() => query.data ?? [], [query.data]);
  const filteredSales = useMemo(() => {
    if (selectedStatus === "all") {
      return sales;
    }

    return sales.filter((sale) => sale.status === selectedStatus);
  }, [sales, selectedStatus]);

  return {
    ...mutations,
    filteredSales,
    isLoading: query.isLoading,
    sales,
    selectedStatus,
    setSelectedStatus,
  };
}
