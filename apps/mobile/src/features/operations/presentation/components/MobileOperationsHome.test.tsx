import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import { PropsWithChildren } from "react";

import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";
import { useTransactionalOperations } from "@/features/operations/presentation/hooks/useTransactionalOperations";

import { MobileOperationsHome } from "./MobileOperationsHome";

jest.mock(
  "@/features/operations/presentation/hooks/useTransactionalOperations",
);

const createSale = jest.fn(async () => ({ id: "sale-mobile-test" }));
const registerLoss = jest.fn(async () => undefined);
const startProduction = jest.fn(async () => undefined);
const mockedUseTransactionalOperations = useTransactionalOperations as unknown as jest.Mock;

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

beforeEach(() => {
  useAuthStore.setState({
    session: {
      expiresAt: new Date("2026-06-18T18:00:00.000Z"),
      token: "sales-token",
      user: {
        email: "vendas@paobom.local",
        id: "user-sales",
        name: "Atendimento PaoBom",
        permissions: ["sales:create", "product:view"],
        role: "sales",
      },
    },
    status: "authenticated",
  });
  mockedUseTransactionalOperations.mockReturnValue({
    createSale: {
      isPending: false,
      mutateAsync: createSale,
    },
    finishProduction: {
      isPending: false,
      mutateAsync: jest.fn(),
    },
    registerLoss: {
      isPending: false,
      mutateAsync: jest.fn(),
    },
    snapshot: {
      data: {
        balances: [],
        productionOrders: [],
        products: [
          {
            active: true,
            id: "prod-bread",
            kind: "finished_product",
            name: "Pao frances",
            purchasePrice: 0.35,
            salePrice: 0.9,
            sku: "PAD-PAO-FRANCES",
            unit: "unit",
          },
        ],
      },
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    },
    startProduction: {
      isPending: false,
      mutateAsync: jest.fn(),
    },
  } as unknown as ReturnType<typeof useTransactionalOperations>);
});

test("mostra somente operacoes permitidas e conclui venda simples", async () => {
  const view = await render(<MobileOperationsHome />, { wrapper });

  expect(view.queryByText("Estoque")).toBeNull();
  expect(view.queryByText("Producao")).toBeNull();

  await fireEvent.press(view.getAllByText("Venda")[0]);
  await fireEvent.press(view.getByText("Pao frances"));
  await fireEvent.press(view.getByText("Finalizar venda"));

  await waitFor(() =>
    expect(createSale).toHaveBeenCalledWith({
      items: [
        {
          productId: "prod-bread",
          quantity: 1,
          unitPrice: 0.9,
        },
      ],
      notes: "Venda mobile",
      paymentMethod: "pix",
    }),
  );
  await waitFor(() =>
    expect(
      view.getByText("Venda SALE-MOB concluida com sucesso."),
    ).toBeTruthy(),
  );
});

test("registra perda e inicia producao quando o perfil permite", async () => {
  useAuthStore.setState({
    session: {
      expiresAt: new Date("2026-06-18T18:00:00.000Z"),
      token: "baker-token",
      user: {
        email: "padeiro@paobom.local",
        id: "user-baker",
        name: "Padeiro PaoBom",
        permissions: [
          "product:view",
          "inventory:view",
          "inventory:register-loss",
          "production:view",
          "production:manage-order",
        ],
        role: "baker",
      },
    },
    status: "authenticated",
  });
  mockedUseTransactionalOperations.mockReturnValue({
    createSale: {
      isPending: false,
      mutateAsync: createSale,
    },
    finishProduction: {
      isPending: false,
      mutateAsync: jest.fn(),
    },
    registerLoss: {
      isPending: false,
      mutateAsync: registerLoss,
    },
    snapshot: {
      data: {
        balances: [
          {
            averageCost: 4.2,
            minimumStock: 30,
            product: {
              active: true,
              id: "prod-flour",
              kind: "raw_material",
              name: "Farinha de trigo",
              purchasePrice: 4.2,
              salePrice: 0,
              sku: "INS-FARINHA",
              unit: "kg",
            },
            productId: "prod-flour",
            quantity: 42,
          },
        ],
        productionOrders: [
          {
            id: "production-planned",
            notes: "Fornada de teste",
            outputProductName: "Pao frances",
            quantityProduced: 180,
            recipeName: "Pao frances",
            recipeVersion: 1,
            status: "planned",
          },
        ],
        products: [],
      },
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    },
    startProduction: {
      isPending: false,
      mutateAsync: startProduction,
    },
  } as unknown as ReturnType<typeof useTransactionalOperations>);

  const view = await render(<MobileOperationsHome />, { wrapper });

  await fireEvent.press(view.getAllByText("Estoque")[0]);
  await fireEvent.press(view.getByText("Farinha de trigo"));
  await fireEvent.changeText(
    view.getByPlaceholderText("0"),
    "0.5",
  );
  await fireEvent.changeText(
    view.getByPlaceholderText("Ex.: validade, quebra ou avaria"),
    "Avaria no transporte",
  );
  await fireEvent.press(view.getByText("Confirmar perda"));

  await waitFor(() =>
    expect(registerLoss).toHaveBeenCalledWith({
      productId: "prod-flour",
      quantity: 0.5,
      reason: "Avaria no transporte",
    }),
  );

  await fireEvent.press(view.getAllByText("Producao")[1]);
  await fireEvent.press(view.getByText("Iniciar"));

  await waitFor(() =>
    expect(startProduction).toHaveBeenCalledWith("production-planned"),
  );
});
