"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserDTO,
} from "@/features/user/data/dto/UserDTO";
import { UserMapper } from "@/features/user/data/mappers/UserMapper";

import { userQueryKeys } from "./keys";

export function useUserMutations() {
  const api = container.get<ApiClient>(TOKENS.apiClient);
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: userQueryKeys.all });

  return {
    createUser: useMutation({
      mutationFn: async (input: CreateUserDTO) =>
        UserMapper.toModel(await api.post<UserDTO>("/users", input)),
      onSuccess,
    }),
    deactivateUser: useMutation({
      mutationFn: async (id: string) =>
        UserMapper.toModel(await api.delete<UserDTO>(`/users/${id}`)),
      onSuccess,
    }),
    updateUser: useMutation({
      mutationFn: async ({
        id,
        input,
      }: {
        id: string;
        input: UpdateUserDTO;
      }) => UserMapper.toModel(await api.patch<UserDTO>(`/users/${id}`, input)),
      onSuccess,
    }),
  };
}
