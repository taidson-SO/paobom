"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { UserDTO } from "@/features/user/data/dto/UserDTO";
import { UserMapper } from "@/features/user/data/mappers/UserMapper";

import { userQueryKeys } from "./keys";

export function useUsersQuery() {
  const api = container.get<ApiClient>(TOKENS.apiClient);

  return useQuery({
    queryFn: async () => {
      const users = await api.get<UserDTO[]>("/users");

      return users.map(UserMapper.toModel);
    },
    queryKey: userQueryKeys.all,
  });
}
