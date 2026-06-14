import { useOperationsOverviewQuery } from "@/features/operations/presentation/react-query/useOperationsOverviewQuery";

export function useOperationsOverview() {
  const query = useOperationsOverviewQuery();

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
