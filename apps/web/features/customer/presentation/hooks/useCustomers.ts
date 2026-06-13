"use client";

import { useCustomerMutations } from "@/features/customer/presentation/react-query/useCustomerMutations";
import { useCustomersQuery } from "@/features/customer/presentation/react-query/useCustomersQuery";
import { useCustomerUIStore } from "@/features/customer/presentation/stores/CustomerUIStore";

export function useCustomers() {
  const query = useCustomersQuery();
  const mutations = useCustomerMutations();
  const selectedCustomerId = useCustomerUIStore(
    (state) => state.selectedCustomerId,
  );
  const setSelectedCustomer = useCustomerUIStore(
    (state) => state.setSelectedCustomer,
  );

  return {
    ...mutations,
    customers: query.data ?? [],
    selectedCustomerId,
    setSelectedCustomer,
  };
}
