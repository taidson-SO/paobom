"use client";

import { Product, PurchaseStatus, Supplier } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { usePurchases } from "@/features/purchase/presentation/hooks/usePurchases";
import { PurchaseSchema } from "@/features/purchase/schemas/PurchaseSchema";

type PurchaseFormItem = {
  productId: string;
  quantity: number;
  unitCost: number;
};

type PurchaseForm = {
  expectedDate: string;
  items: PurchaseFormItem[];
  notes: string;
  supplierId: string;
};

type ReceiptDraft = {
  divergenceReason: string;
  receivedBy: string;
  items: Record<string, number>;
};

const initialForm: PurchaseForm = {
  expectedDate: new Date().toISOString().slice(0, 10),
  items: [{ productId: "", quantity: 1, unitCost: 0 }],
  notes: "",
  supplierId: "",
};

export function PurchaseSection({
  products,
  suppliers,
}: {
  products: Product[];
  suppliers: Supplier[];
}) {
  const {
    approvePurchase,
    cancelPurchase,
    createPurchase,
    purchases,
    receivePurchase,
  } = usePurchases();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canCreatePurchase = can("purchase:create");
  const canReceivePurchase = can("purchase:receive");
  const canCancelPurchase = can("purchase:cancel");
  const [form, setForm] = useState<PurchaseForm>(initialForm);
  const [receiptDrafts, setReceiptDrafts] = useState<Record<string, ReceiptDraft>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const activeProducts = products.filter((product) => product.isPurchasable());
  const activeSuppliers = suppliers.filter((supplier) => supplier.active);
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const supplierNames = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );
  const total = form.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreatePurchase) {
      setError("Seu perfil nao pode criar compras.");
      return;
    }

    setError(null);

    try {
      const input = PurchaseSchema.parse(form);

      const purchase = await createPurchase.mutateAsync(input);
      recordAudit({
        action: "purchase.create",
        description: `Compra ${purchase.id} criada`,
        entity: "purchase",
        entityId: purchase.id,
        metadata: {
          items: purchase.items.length,
          supplierId: purchase.supplierId,
          total: purchase.total,
        },
      });
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compra invalida");
    }
  }

  function updateItem(index: number, nextItem: Partial<PurchaseFormItem>) {
    setForm((state) => ({
      ...state,
      items: state.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextItem } : item,
      ),
    }));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);

    updateItem(index, {
      productId,
      unitCost: product?.purchasePrice ?? 0,
    });
  }

  function getReceiptDraft(purchaseId: string) {
    return receiptDrafts[purchaseId] ?? {
      divergenceReason: "",
      items: {},
      receivedBy: "Estoque",
    };
  }

  function updateReceiptDraft(
    purchaseId: string,
    nextDraft: Partial<ReceiptDraft>,
  ) {
    setReceiptDrafts((state) => ({
      ...state,
      [purchaseId]: {
        ...getReceiptDraft(purchaseId),
        ...nextDraft,
      },
    }));
  }

  function updateReceiptQuantity(
    purchaseId: string,
    productId: string,
    receivedQuantity: number,
  ) {
    const draft = getReceiptDraft(purchaseId);

    updateReceiptDraft(purchaseId, {
      items: {
        ...draft.items,
        [productId]: receivedQuantity,
      },
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 xl:grid-cols-[420px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-bold text-green-800">Compras</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Pedido e recebimento
          </h2>
        </div>
        {!canCreatePurchase ? (
          <PermissionNotice description="Voce pode consultar compras, mas nao criar novos pedidos." />
        ) : null}

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Fornecedor
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.supplierId}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                supplierId: event.target.value,
              }))
            }
          >
            <option value="">Selecione</option>
            {activeSuppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Previsao
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            type="date"
            value={form.expectedDate}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                expectedDate: event.target.value,
              }))
            }
          />
        </label>

        <div className="space-y-2">
          {form.items.map((item, index) => (
            <div
              className="grid gap-2 rounded-md border border-zinc-200 p-3"
              key={index}
            >
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Produto
                <select
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  value={item.productId}
                  onChange={(event) => selectProduct(index, event.target.value)}
                >
                  <option value="">Selecione</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Quantidade"
                  value={item.quantity}
                  onChange={(quantity) => updateItem(index, { quantity })}
                />
                <NumberField
                  label="Custo unit."
                  value={item.unitCost}
                  onChange={(unitCost) => updateItem(index, { unitCost })}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700"
          type="button"
          onClick={() =>
            setForm((state) => ({
              ...state,
              items: [
                ...state.items,
                { productId: "", quantity: 1, unitCost: 0 },
              ],
            }))
          }
        >
          Adicionar item
        </button>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Observacoes
          <textarea
            className="min-h-16 rounded-md border border-zinc-300 px-3 py-2"
            value={form.notes}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                notes: event.target.value,
              }))
            }
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-700">
            Total: R$ {total.toFixed(2)}
          </p>
          <button
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white disabled:bg-zinc-300"
            disabled={!canCreatePurchase}
          >
            Criar compra
          </button>
        </div>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      <div className="overflow-hidden rounded-md border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Compra</th>
              <th className="px-3 py-2">Itens</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr className="border-t border-zinc-100 align-top" key={purchase.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold text-zinc-950">
                    {supplierNames.get(purchase.supplierId) ?? "Fornecedor"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Prev. {purchase.expectedDate.toLocaleDateString()}
                  </p>
                  {purchase.approvedBy ? (
                    <p className="text-xs text-zinc-500">
                      Aprovada por {purchase.approvedBy}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-zinc-700">
                  {purchase.items.map((item) => (
                    <div className="mb-2 grid gap-1" key={item.id}>
                      <p>
                        {productNames.get(item.productId) ?? "Produto"} ·{" "}
                        {item.quantity} x R$ {item.unitCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Recebido: {item.receivedQuantity ?? 0} / {item.quantity}
                      </p>
                      {canReceivePurchase &&
                      isReceivableStatus(purchase.status) ? (
                        <input
                          className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-xs"
                          min="0"
                          step="0.01"
                          type="number"
                          value={
                            getReceiptDraft(purchase.id).items[item.productId] ??
                            item.quantity
                          }
                          onChange={(event) =>
                            updateReceiptQuantity(
                              purchase.id,
                              item.productId,
                              Number(event.target.value),
                            )
                          }
                        />
                      ) : null}
                    </div>
                  ))}
                  {canReceivePurchase && isReceivableStatus(purchase.status) ? (
                    <div className="mt-2 grid max-w-xs gap-2">
                      <input
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        placeholder="Responsavel"
                        value={getReceiptDraft(purchase.id).receivedBy}
                        onChange={(event) =>
                          updateReceiptDraft(purchase.id, {
                            receivedBy: event.target.value,
                          })
                        }
                      />
                      <input
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        placeholder="Justificativa de divergencia"
                        value={getReceiptDraft(purchase.id).divergenceReason}
                        onChange={(event) =>
                          updateReceiptDraft(purchase.id, {
                            divergenceReason: event.target.value,
                          })
                        }
                      />
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3 font-semibold text-zinc-800">
                  R$ {purchase.total.toFixed(2)}
                </td>
                <td className="px-3 py-3">
                  <Status status={purchase.status} />
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {purchase.status === "pending_approval" &&
                    canCreatePurchase ? (
                      <button
                        className="text-sm font-semibold text-green-800"
                        onClick={async () => {
                          await approvePurchase.mutateAsync({
                            approvedBy: "Gerencia",
                            purchaseId: purchase.id,
                          });
                          recordAudit({
                            action: "purchase.approve",
                            description: `Compra ${purchase.id} aprovada`,
                            entity: "purchase",
                            entityId: purchase.id,
                            metadata: { total: purchase.total },
                          });
                        }}
                      >
                        Aprovar
                      </button>
                    ) : null}
                    {isReceivableStatus(purchase.status) ? (
                      <>
                        {canReceivePurchase ? (
                          <button
                            className="text-sm font-semibold text-green-800"
                            onClick={async () => {
                              const draft = getReceiptDraft(purchase.id);
                              await receivePurchase.mutateAsync({
                                divergenceReason:
                                  draft.divergenceReason || null,
                                items: purchase.items.map((item) => ({
                                  productId: item.productId,
                                  receivedQuantity:
                                    draft.items[item.productId] ?? item.quantity,
                                })),
                                purchaseId: purchase.id,
                                receivedBy: draft.receivedBy,
                              });
                              recordAudit({
                                action: "purchase.receive",
                                description: `Compra ${purchase.id} recebida`,
                                entity: "purchase",
                                entityId: purchase.id,
                                metadata: { total: purchase.total },
                              });
                            }}
                          >
                            Receber
                          </button>
                        ) : null}
                        {canCancelPurchase ? (
                          <button
                            className="text-sm font-semibold text-zinc-500"
                            onClick={async () => {
                              await cancelPurchase.mutateAsync(purchase.id);
                              recordAudit({
                                action: "purchase.cancel",
                                description: `Compra ${purchase.id} cancelada`,
                                entity: "purchase",
                                entityId: purchase.id,
                                metadata: { status: purchase.status },
                              });
                            }}
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </>
                    ) : null}
                    {purchase.status === "received" && canCancelPurchase ? (
                      <button
                        className="text-sm font-semibold text-zinc-500"
                        onClick={async () => {
                          await cancelPurchase.mutateAsync(purchase.id);
                          recordAudit({
                            action: "purchase.reverse",
                            description: `Compra ${purchase.id} estornada`,
                            entity: "purchase",
                            entityId: purchase.id,
                            metadata: { total: purchase.total },
                          });
                        }}
                      >
                        Estornar
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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

function Status({ status }: { status: PurchaseStatus }) {
  const styles = {
    approved: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-zinc-100 text-zinc-500",
    draft: "bg-sky-100 text-sky-800",
    ordered: "bg-amber-100 text-amber-800",
    partially_received: "bg-orange-100 text-orange-800",
    pending_approval: "bg-violet-100 text-violet-800",
    received: "bg-green-100 text-green-800",
  };

  const labels = {
    approved: "Aprovada",
    cancelled: "Cancelada",
    draft: "Rascunho",
    ordered: "Pedido",
    partially_received: "Parcial",
    pending_approval: "Aguardando aprovacao",
    received: "Recebida",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function isReceivableStatus(status: PurchaseStatus) {
  return (
    status === "approved" ||
    status === "ordered" ||
    status === "partially_received"
  );
}
