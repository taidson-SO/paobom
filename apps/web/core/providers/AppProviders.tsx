"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { WebAuthGate } from "@/features/auth/presentation/components/WebAuthGate";

type AppProvidersProps = PropsWithChildren<{
  bootstrap?: () => void;
}>;

export function AppProviders({ bootstrap, children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  bootstrap?.();

  useEffect(() => {
    const api = container.get<ApiClient>(TOKENS.apiClient);
    const handleError = (event: ErrorEvent) => {
      void api.reportClientError(event.error ?? event.message).catch(() => undefined);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      void api.reportClientError(event.reason).catch(() => undefined);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WebAuthGate>{children}</WebAuthGate>
    </QueryClientProvider>
  );
}
