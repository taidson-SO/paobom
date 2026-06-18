import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import { PropsWithChildren } from "react";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { AuthRepository, MobileSession } from "@/features/auth/domain/auth";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";

import { LoginScreen } from "./LoginScreen";

const session: MobileSession = {
  expiresAt: new Date("2026-06-18T18:00:00.000Z"),
  token: "mobile-test-token",
  user: {
    email: "vendas@paobom.local",
    id: "user-sales",
    name: "Atendimento PaoBom",
    permissions: ["sales:create", "product:view"],
    role: "sales",
  },
};

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            mutations: { gcTime: Infinity, retry: false },
            queries: { gcTime: Infinity, retry: false },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

test("autentica com credenciais informadas pelo usuario", async () => {
  const login = jest.fn(async () => session);

  container.register<AuthRepository>(TOKENS.authRepository, () => ({
    clearLocalSession: jest.fn(async () => undefined),
    login,
    logout: jest.fn(async () => undefined),
    restoreSession: jest.fn(async () => null),
  }));

  const view = await render(<LoginScreen />, { wrapper });

  expect(view.getByText("Entrar")).toBeDisabled();

  await fireEvent.changeText(
    view.getByPlaceholderText("usuario@paobom.local"),
    "vendas@paobom.local",
  );
  await fireEvent.changeText(
    view.getByPlaceholderText("Sua senha"),
    "Paobom@123",
  );
  await fireEvent.press(view.getByText("Entrar"));

  await waitFor(() =>
    expect(login).toHaveBeenCalledWith(
      "vendas@paobom.local",
      "Paobom@123",
    ),
  );
  await waitFor(() =>
    expect(useAuthStore.getState().session?.user.id).toBe("user-sales"),
  );
});

test("apresenta erro de autenticacao sem preencher a store", async () => {
  container.register<AuthRepository>(TOKENS.authRepository, () => ({
    clearLocalSession: jest.fn(async () => undefined),
    login: jest.fn(async () => {
      throw new Error("Credenciais invalidas");
    }),
    logout: jest.fn(async () => undefined),
    restoreSession: jest.fn(async () => null),
  }));

  const view = await render(<LoginScreen />, { wrapper });

  await fireEvent.changeText(
    view.getByPlaceholderText("usuario@paobom.local"),
    "invalido@paobom.local",
  );
  await fireEvent.changeText(view.getByPlaceholderText("Sua senha"), "errada");
  await fireEvent.press(view.getByText("Entrar"));

  await waitFor(() =>
    expect(view.getByText("Credenciais invalidas")).toBeTruthy(),
  );
  expect(useAuthStore.getState().session).toBeNull();
});
