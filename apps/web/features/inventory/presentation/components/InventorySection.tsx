"use client";

import { Product } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useInventory } from "@/features/inventory/presentation/hooks/useInventory";
import {
  RegisterAdjustmentSchema,
  RegisterLossSchema,
} from "@/features/inventory/schemas/InventorySchema";

type MovementMode = "loss" | "adjustment";

type InventoryForm = {
  mode: MovementMode;
  productId: string;
  quantity: number;
  reason: string;
};

const initialForm: InventoryForm = {
  mode: "loss",
  productId: "",
  quantity: 1,
  reason: "",
};

const movementLabels = {
  adjustment: "Ajuste",
  loss: "Perda",
  production_in: "Entrada producao",
  production_out: "Saida producao",
  purchase_in: "Compra",
  sale_out: "Venda",
};

export function InventorySection({ products }: { products: Product[] }) {
  const {
    balances,
    movements,
    registerAdjustment,
    registerLoss,
    selectedProductId,
    setSelectedProduct,
  } = useInventory();
  const [form, setForm] = useState<InventoryForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const activeProducts = products.filter((product) => product.active);
  const lowStockCount = balances.filter((balance) => balance.isBelowMinimum).length;
  const totalValue = balances.reduce(
    (sum, balance) => sum + balance.estimatedValue,
    0,
  );
  const visibleMovements = selectedProductId
    ? movements.filter((movement) => movement.productId === selectedProductId)
    : movements;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      if (form.mode === "loss") {
        const input = RegisterLossSchema.parse(form);
        await registerLoss.mutateAsync(input);
      } else {
        const input = RegisterAdjustmentSchema.parse(form);
        await registerAdjustment.mutateAsync(input);
      }

      setForm(initialForm);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Movimentacao invalida",
      );
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold text-green-800">Estoque</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Saldos, perdas e ajustes
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Valor estimado" value={`R$ ${totalValue.toFixed(2)}`} />
          <Metric label="Abaixo minimo" value={String(lowStockCount)} />
        </div>

        <form className="space-y-3 rounded-md border border-zinc-200 p-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-md border px-3 py-2 text-sm font-bold ${
                form.mode === "loss"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-zinc-300 text-zinc-700"
              }`}
              type="button"
              onClick={() => setForm((state) => ({ ...state, mode: "loss" }))}
            >
              Perda
            </button>
            <button
              className={`rounded-md border px-3 py-2 text-sm font-bold ${
                form.mode === "adjustment"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-zinc-300 text-zinc-700"
              }`}
              type="button"
              onClick={() =>
                setForm((state) => ({ ...state, mode: "adjustment" }))
              }
            >
              Ajuste
            </button>
          </div>

          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Produto
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.productId}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  productId: event.target.value,
                }))
              }
            >
              <option value="">Selecione</option>
              {activeProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <NumberField
            label="Quantidade"
            value={form.quantity}
            onChange={(quantity) =>
              setForm((state) => ({ ...state, quantity }))
            }
          />

          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Motivo
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.reason}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  reason: event.target.value,
                }))
              }
            />
          </label>

          <button className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white">
            Registrar
          </button>

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
        </form>
      </div>

      <div className="grid gap-4">
        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Saldo</th>
                <th className="px-3 py-2">Minimo</th>
                <th className="px-3 py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => (
                <tr
                  className={`cursor-pointer border-t border-zinc-100 ${
                    selectedProductId === balance.productId ? "bg-green-50" : ""
                  }`}
                  key={balance.productId}
                  onClick={() =>
                    setSelectedProduct(
                      selectedProductId === balance.productId
                        ? null
                        : balance.productId,
                    )
                  }
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-950">
                      {productNames.get(balance.productId) ?? "Produto"}
                    </p>
                    {balance.isBelowMinimum ? (
                      <p className="text-xs font-bold text-red-700">
                        Abaixo do minimo
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {balance.quantity}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {balance.minimumStock}
                  </td>
                  <td className="px-3 py-3 font-semibold text-zinc-800">
                    R$ {balance.estimatedValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Movimento</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Qtd.</th>
                <th className="px-3 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.map((movement) => (
                <tr className="border-t border-zinc-100" key={movement.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-950">
                      {movementLabels[movement.type]}
                    </p>
                    <p className="text-xs text-zinc-500">{movement.reason}</p>
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {productNames.get(movement.productId) ?? "Produto"}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {movement.quantity}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {movement.occurredAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        className="rounded-md border border-zinc-300 px-3 py-2"
        min="0"
        step="0.01"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
