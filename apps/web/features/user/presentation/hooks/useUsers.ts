"use client";

import { useUserMutations } from "@/features/user/presentation/react-query/useUserMutations";
import { useUsersQuery } from "@/features/user/presentation/react-query/useUsersQuery";
import { useUserUIStore } from "@/features/user/presentation/stores/UserUIStore";

export function useUsers() {
  const query = useUsersQuery();
  const mutations = useUserMutations();
  const selectedUserId = useUserUIStore((state) => state.selectedUserId);
  const setSelectedUser = useUserUIStore((state) => state.setSelectedUser);

  return {
    ...mutations,
    isLoading: query.isLoading,
    selectedUserId,
    setSelectedUser,
    users: query.data ?? [],
  };
}
