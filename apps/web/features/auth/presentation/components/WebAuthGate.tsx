"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, PropsWithChildren, useEffect, useState } from "react";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import {
  WebSessionUser,
  getRoleLabel,
  usePermissionSessionStore,
} from "@/core/permissions/permission-session";

export function WebAuthGate({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const status = usePermissionSessionStore((state) => state.status);
  const setUser = usePermissionSessionStore((state) => state.setUser);
  const clearSession = usePermissionSessionStore(
    (state) => state.clearSession,
  );
  const api = container.get<ApiClient>(TOKENS.apiClient);

  useEffect(() => {
    let active = true;

    api.setUnauthorizedHandler(() => {
      queryClient.clear();
      clearSession();
    });

    void api
      .me()
      .then((user) => {
        if (active) {
          setUser(user as WebSessionUser);
        }
      })
      .catch(() => {
        if (active) {
          clearSession();
        }
      });

    return () => {
      active = false;
      api.setUnauthorizedHandler(null);
    };
  }, [api, clearSession, queryClient, setUser]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <p className="text-sm font-semibold text-zinc-600">
          Restaurando sessao...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <WebLoginForm api={api} onAuthenticated={setUser} />;
  }

  return children;
}

function WebLoginForm({
  api,
  onAuthenticated,
}: {
  api: ApiClient;
  onAuthenticated: (user: WebSessionUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await api.login(email.trim(), password);

      onAuthenticated(session.user as WebSessionUser);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Nao foi possivel entrar",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-md bg-green-800 text-lg font-black text-white">
            PB
          </div>
          <div>
            <p className="text-xs font-black uppercase text-green-800">
              PaoBom ERP
            </p>
            <h1 className="text-2xl font-black text-zinc-950">
              Acesso operacional
            </h1>
          </div>
        </div>

        <form
          className="grid gap-4 rounded-md border border-zinc-200 bg-white p-5 shadow-sm"
          onSubmit={submit}
        >
          <label className="grid gap-1.5 text-sm font-bold text-zinc-800">
            E-mail
            <input
              autoComplete="username"
              autoFocus
              className="h-11 rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@paobom.local"
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-bold text-zinc-800">
            Senha
            <input
              autoComplete="current-password"
              className="h-11 rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}

          <button
            className="h-11 rounded-md bg-green-800 px-4 text-sm font-black text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!email.trim() || !password || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export function AuthenticatedUserSummary() {
  const user = usePermissionSessionStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <div className="text-right">
      <p className="text-sm font-bold text-zinc-900">{user.name}</p>
      <p className="text-xs text-zinc-500">
        {getRoleLabel(user.role)} · {user.email}
      </p>
    </div>
  );
}
