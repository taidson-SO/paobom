"use client";

import { Product, ProductKind, StockMovementOrigin } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useInventory } from "@/features/inventory/presentation/hooks/useInventory";
import {
  RegisterAdjustmentSchema,
  RegisterLossSchema,
  RegisterPhysicalInventoryCountSchema,
} from "@/features/inventory/schemas/InventorySchema";

type MovementMode = "loss" | "adjustment";

type InventoryForm = {
  mode: MovementMode;
  productId: string;
  quantity: number;
  reason: string;
};

type CountForm = {
  countedBy: string;
  countedQuantity: number;
  productId: string;
  reason: string;
};

const initialForm: InventoryForm = {
  mode: "loss",
  productId: "",
  quantity: 1,
  reason: "",
};

const initialCountForm: CountForm = {
  countedBy: "Gerencia",
  countedQuantity: 0,
  productId: "",
  reason: "",
};

const movementLabels = {
  adjustment: "Ajuste",
  loss: "Perda",
  production_in: "Entrada producao",
  production_out: "Saida producao",
  production_reversal: "Estorno producao",
  purchase_in: "Compra",
  purchase_reversal: "Estorno compra",
  sale_out: "Venda",
  sale_reversal: "Estorno venda",
};

const originLabels: Record<StockMovementOrigin, string> = {
  loss: "Perda",
  manual_adjustment: "Ajuste manual",
  opening_balance: "Saldo inicial",
  production: "Producao",
  purchase: "Compra",
  return: "Devolucao",
  sale: "Venda",
};

const kindLabels: Record<ProductKind, string> = {
  finished_product: "Produto final",
  packaging: "Embalagem",
  raw_material: "Insumo",
  resale: "Revenda",
};

export function InventorySection({ products }: { products: Product[] }) {
  const {
    balances,
    counts,
    lots,
    movements,
    registerAdjustment,
    registerPhysicalCount,
    registerLoss,
    selectedProductId,
    setSelectedProduct,
  } = useInventory();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canRegisterLoss = can("inventory:register-loss");
  const canAdjustInventory = can("inventory:adjust");
  const canRegisterMovement = canRegisterLoss || canAdjustInventory;
  const [form, setForm] = useState<InventoryForm>(initialForm);
  const [countForm, setCountForm] = useState<CountForm>(initialCountForm);
  const [error, setError] = useState<string | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const productKinds = useMemo(
    () => new Map(products.map((product) => [product.id, product.kind])),
    [products],
  );
  const activeProducts = products.filter((product) => product.active);
  const lowStockCount = balances.filter((balance) => balance.isBelowMinimum).length;
  const expiringLots = lots.filter((lot) => {
    if (!lot.expirationDate || lot.status === "depleted") {
      return false;
    }

    const threshold = new Date();

    threshold.setDate(threshold.getDate() + 7);

    return lot.expirationDate <= threshold;
  }).length;
  const divergenceCount = counts.filter((count) => count.hasDivergence).length;
  const totalValue = balances.reduce(
    (sum, balance) => sum + balance.estimatedValue,
    0,
  );
  const visibleMovements = selectedProductId
    ? movements.filter((movement) => movement.productId === selectedProductId)
    : movements;
  const visibleLots = selectedProductId
    ? lots.filter((lot) => lot.productId === selectedProductId)
    : lots;
  const visibleCounts = selectedProductId
    ? counts.filter((count) => count.productId === selectedProductId)
    : counts;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.mode === "loss" && !canRegisterLoss) {
      setError("Seu perfil nao pode registrar perdas.");
      return;
    }

    if (form.mode === "adjustment" && !canAdjustInventory) {
      setError("Seu perfil nao pode registrar ajustes.");
      return;
    }

    setError(null);

    try {
      if (form.mode === "loss") {
        const input = RegisterLossSchema.parse(form);
        const movement = await registerLoss.mutateAsync(input);
        recordAudit({
          action: "inventory.loss",
          description: "Perda de estoque registrada",
          entity: "inventory",
          entityId: movement.productId,
          metadata: {
            productId: movement.productId,
            quantity: movement.quantity,
          },
        });
      } else {
        const input = RegisterAdjustmentSchema.parse(form);
        const movement = await registerAdjustment.mutateAsync(input);
        recordAudit({
          action: "inventory.adjust",
          description: "Ajuste de estoque registrado",
          entity: "inventory",
          entityId: movement.productId,
          metadata: {
            productId: movement.productId,
            quantity: movement.quantity,
          },
        });
      }

      setForm(initialForm);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Movimentacao invalida",
      );
    }
  }

  async function handleCountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAdjustInventory) {
      setCountError("Seu perfil nao pode registrar inventario fisico.");
      return;
    }

    setCountError(null);

    try {
      const input = RegisterPhysicalInventoryCountSchema.parse({
        ...countForm,
        reason: countForm.reason || null,
      });
      const count = await registerPhysicalCount.mutateAsync(input);

      recordAudit({
        action: "inventory.count",
        description: "Contagem fisica de estoque registrada",
        entity: "inventory",
        entityId: count.productId,
        metadata: {
          countedQuantity: count.countedQuantity,
          divergenceQuantity: count.divergenceQuantity,
          productId: count.productId,
        },
      });
      setCountForm(initialCountForm);
    } catch (cause) {
      setCountError(
        cause instanceof Error ? cause.message : "Contagem invalida",
      );
    }
  }

  return (
    <section className="brand-card grid gap-4 p-4 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <div>
          <p className="brand-kicker text-sm">Estoque</p>
          <h2 className="brand-section-title text-xl">
            Saldos, perdas e ajustes
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Valor estimado" value={`R$ ${totalValue.toFixed(2)}`} />
          <Metric label="Abaixo minimo" value={String(lowStockCount)} />
          <Metric label="Lotes a vencer" value={String(expiringLots)} />
          <Metric label="Divergencias" value={String(divergenceCount)} />
        </div>

        <form className="brand-card-warm space-y-3 p-3" onSubmit={handleSubmit}>
          {!canRegisterMovement ? (
            <PermissionNotice description="Voce pode consultar estoque e movimentos, mas nao registrar perdas ou ajustes." />
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-md border px-3 py-2 text-sm font-bold ${
                form.mode === "loss"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-[var(--brand-line)] text-[var(--brand-caramel)]"
              }`}
              disabled={!canRegisterLoss}
              type="button"
              onClick={() => setForm((state) => ({ ...state, mode: "loss" }))}
            >
              Perda
            </button>
            <button
              className={`rounded-md border px-3 py-2 text-sm font-bold ${
                form.mode === "adjustment"
                  ? "border-[#c4d8a8] bg-[#f4f9ec] text-[var(--brand-leaf)]"
                  : "border-[var(--brand-line)] text-[var(--brand-caramel)]"
              }`}
              disabled={!canAdjustInventory}
              type="button"
              onClick={() =>
                setForm((state) => ({ ...state, mode: "adjustment" }))
              }
            >
              Ajuste
            </button>
          </div>

          <label className="brand-muted grid gap-1 text-sm font-medium">
            Produto
            <select
              className="brand-input px-3 py-2"
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

          <label className="brand-muted grid gap-1 text-sm font-medium">
            Motivo
            <input
              className="brand-input px-3 py-2"
              value={form.reason}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  reason: event.target.value,
                }))
              }
            />
          </label>

          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canRegisterMovement}
          >
            Registrar
          </button>

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
        </form>

        <form className="brand-card-warm space-y-3 p-3" onSubmit={handleCountSubmit}>
          {!canAdjustInventory ? (
            <PermissionNotice description="Voce pode consultar inventario fisico, mas nao registrar contagens." />
          ) : null}
          <div>
            <p className="brand-section-title text-sm">Inventario fisico</p>
            <p className="brand-muted text-xs">
              Registre contagens e justifique divergencias.
            </p>
          </div>
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Produto
            <select
              className="brand-input px-3 py-2"
              value={countForm.productId}
              onChange={(event) =>
                setCountForm((state) => ({
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
            label="Quantidade contada"
            value={countForm.countedQuantity}
            onChange={(countedQuantity) =>
              setCountForm((state) => ({ ...state, countedQuantity }))
            }
          />
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Responsavel
            <input
              className="brand-input px-3 py-2"
              value={countForm.countedBy}
              onChange={(event) =>
                setCountForm((state) => ({
                  ...state,
                  countedBy: event.target.value,
                }))
              }
            />
          </label>
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Justificativa
            <input
              className="brand-input px-3 py-2"
              value={countForm.reason}
              onChange={(event) =>
                setCountForm((state) => ({
                  ...state,
                  reason: event.target.value,
                }))
              }
            />
          </label>
          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canAdjustInventory}
          >
            Registrar contagem
          </button>
          {countError ? (
            <p className="text-sm font-semibold text-red-700">{countError}</p>
          ) : null}
        </form>
      </div>

      <div className="grid gap-4">
        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Lote</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Qtd.</th>
                <th className="px-3 py-2">Validade</th>
                <th className="px-3 py-2">Origem</th>
              </tr>
            </thead>
            <tbody>
              {visibleLots.map((lot) => (
                <tr className="border-t border-[#f1dfb5]" key={lot.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">{lot.lotCode}</p>
                    <p className="brand-muted text-xs">{lot.status}</p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {productNames.get(lot.productId) ?? "Produto"}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">{lot.quantity}</td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {lot.expirationDate
                      ? lot.expirationDate.toLocaleDateString()
                      : "sem validade"}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p>{lot.purchaseId ?? "operacional"}</p>
                    <p className="brand-muted text-xs">
                      {lot.supplierId ?? "sem fornecedor"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Saldo</th>
                <th className="px-3 py-2">Minimo</th>
                <th className="px-3 py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => (
                <tr
                  className={`cursor-pointer border-t border-[#f1dfb5] ${
                    selectedProductId === balance.productId ? "bg-[#f4f9ec]" : ""
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
                    <p className="brand-section-title font-semibold">
                      {productNames.get(balance.productId) ?? "Produto"}
                    </p>
                    {balance.isBelowMinimum ? (
                      <p className="text-xs font-bold text-red-700">
                        Abaixo do minimo
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {getProductKindLabel(productKinds.get(balance.productId))}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {balance.quantity}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {balance.minimumStock}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                    R$ {balance.estimatedValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Movimento</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Lote</th>
                <th className="px-3 py-2">Qtd.</th>
                <th className="px-3 py-2">Origem</th>
                <th className="px-3 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.map((movement) => (
                <tr className="border-t border-[#f1dfb5]" key={movement.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {movementLabels[movement.type]}
                    </p>
                    <p className="brand-muted text-xs">
                      {movement.reason}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {productNames.get(movement.productId) ?? "Produto"}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {movement.lotId ?? "sem lote"}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {movement.quantity}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p>{originLabels[movement.origin]}</p>
                    <p className="brand-muted text-xs">
                      {movement.referenceId ?? "sem referencia"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {movement.occurredAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Contagem</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Esperado</th>
                <th className="px-3 py-2">Contado</th>
                <th className="px-3 py-2">Divergencia</th>
              </tr>
            </thead>
            <tbody>
              {visibleCounts.map((count) => (
                <tr className="border-t border-[#f1dfb5]" key={count.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {count.countedBy}
                    </p>
                    <p className="brand-muted text-xs">
                      {count.countedAt.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {productNames.get(count.productId) ?? "Produto"}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {count.expectedQuantity}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {count.countedQuantity}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p
                      className={
                        count.hasDivergence
                          ? "font-bold text-red-700"
                          : "font-semibold text-[var(--brand-leaf)]"
                      }
                    >
                      {count.divergenceQuantity}
                    </p>
                    <p className="brand-muted text-xs">
                      {count.reason ?? "sem divergencia"}
                    </p>
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

function getProductKindLabel(kind?: ProductKind) {
  return kind ? kindLabels[kind] : "Nao classificado";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="brand-card-warm p-3">
      <p className="brand-muted text-xs font-bold uppercase">{label}</p>
      <p className="brand-section-title mt-1 text-xl">{value}</p>
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
    <label className="brand-muted grid gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        min="0"
        step="0.01"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
