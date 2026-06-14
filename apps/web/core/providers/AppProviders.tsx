"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

type AppProvidersProps = PropsWithChildren<{
  bootstrap?: () => void;
}>;

export function AppProviders({ bootstrap, children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  bootstrap?.();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
