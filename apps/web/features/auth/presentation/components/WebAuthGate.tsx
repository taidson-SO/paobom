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
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-cream-soft)] px-4">
        <p className="brand-muted text-sm font-semibold">
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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#f9cc4b33,transparent_34%),linear-gradient(135deg,#fff7dc_0%,#fffaf0_48%,#f4dfb5_100%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-md border border-[var(--brand-gold)] bg-[var(--brand-brown)] text-xl font-black text-[var(--brand-cream)] shadow-sm">
            PB
          </div>
          <div>
            <p className="brand-kicker text-xs font-black uppercase">
              Panificadora PaoBom
            </p>
            <h1 className="brand-section-title text-2xl font-black">
              Acesso operacional
            </h1>
            <p className="brand-muted mt-1 text-sm font-semibold">
              Gestao da fornada, do balcao e do caixa.
            </p>
          </div>
        </div>

        <form
          className="brand-card grid gap-4 p-5"
          onSubmit={submit}
        >
          <label className="grid gap-1.5 text-sm font-bold text-[var(--brand-ink)]">
            E-mail
            <input
              autoComplete="username"
              autoFocus
              className="brand-input h-11 px-3 font-normal"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@paobom.local"
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-bold text-[var(--brand-ink)]">
            Senha
            <input
              autoComplete="current-password"
              className="brand-input h-11 px-3 font-normal"
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
            className="brand-primary-button h-11 px-4 text-sm font-black"
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
      <p className="text-sm font-bold text-[var(--brand-ink)]">{user.name}</p>
      <p className="brand-muted text-xs">
        {getRoleLabel(user.role)} · {user.email}
      </p>
    </div>
  );
}
