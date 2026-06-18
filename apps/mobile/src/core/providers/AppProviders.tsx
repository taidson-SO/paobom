import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { AuthRepository } from "@/features/auth/domain/auth";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";

type AppProvidersProps = PropsWithChildren<{
  bootstrap?: () => void;
}>;

export function AppProviders({ bootstrap, children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  bootstrap?.();

  useEffect(() => {
    const apiClient = container.get<ApiClient>(TOKENS.apiClient);
    const authRepository = container.get<AuthRepository>(TOKENS.authRepository);
    let active = true;

    apiClient.setUnauthorizedHandler(() => {
      void authRepository.clearLocalSession();
      queryClient.clear();
      clearSession();
    });

    void authRepository.restoreSession().then((session) => {
      if (!active) {
        return;
      }

      if (session) {
        setSession(session);
      } else {
        clearSession();
      }
    });

    return () => {
      active = false;
      apiClient.setUnauthorizedHandler(null);
    };
  }, [clearSession, queryClient, setSession]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
