"use client";

import { useMemo } from "react";

import { useCustomerRelationshipUIStore } from "@/features/customer-relationship/presentation/stores/CustomerRelationshipUIStore";

import { useCustomerRelationshipMutations } from "../react-query/useCustomerRelationshipMutations";
import {
  useCustomerInteractionsQuery,
  useCustomerRelationshipSummaryQuery,
} from "../react-query/useCustomerRelationshipQueries";

export function useCustomerRelationship() {
  const interactionsQuery = useCustomerInteractionsQuery();
  const summaryQuery = useCustomerRelationshipSummaryQuery();
  const mutations = useCustomerRelationshipMutations();
  const { selectedStatus, setSelectedStatus } =
    useCustomerRelationshipUIStore();
  const interactions = useMemo(
    () => interactionsQuery.data ?? [],
    [interactionsQuery.data],
  );
  const filteredInteractions = useMemo(() => {
    if (selectedStatus === "all") {
      return interactions;
    }

    return interactions.filter(
      (interaction) => interaction.status === selectedStatus,
    );
  }, [interactions, selectedStatus]);

  return {
    ...mutations,
    filteredInteractions,
    interactions,
    isLoading: interactionsQuery.isLoading || summaryQuery.isLoading,
    selectedStatus,
    setSelectedStatus,
    summary: summaryQuery.data ?? {
      completedInteractions: 0,
      interactionsByType: {
        campaign: 0,
        complaint: 0,
        feedback: 0,
        follow_up: 0,
        order: 0,
      },
      nextContactAt: null,
      openFollowUps: 0,
      totalInteractions: 0,
    },
  };
}
