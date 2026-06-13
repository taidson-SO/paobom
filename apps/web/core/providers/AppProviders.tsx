"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

import { bootstrapContainer } from "@/core/infrastructure/di/bootstrap";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  bootstrapContainer();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
