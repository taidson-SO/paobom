"use client";

import {
  Customer,
  InventoryBalance,
  PaymentMethod,
  Product,
  SaleStatus,
} from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useSales } from "@/features/sales/presentation/hooks/useSales";
import { SaleSchema } from "@/features/sales/schemas/SalesSchema";

type SaleFormItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

type SaleForm = {
  customerId: string;
  discountAmount: number;
  discountAuthorizedBy: string;
  discountReason: string;
  items: SaleFormItem[];
  notes: string;
  oversellApprovedBy: string;
  oversellJustification: string;
  paymentCardBrand: string;
  paymentInstallments: number;
  paymentMethod: PaymentMethod;
  paymentReferenceCode: string;
};

const initialForm: SaleForm = {
  customerId: "",
  discountAmount: 0,
  discountAuthorizedBy: "",
  discountReason: "",
  items: [{ productId: "", quantity: 1, unitPrice: 0 }],
  notes: "",
  oversellApprovedBy: "",
  oversellJustification: "",
  paymentCardBrand: "",
  paymentInstallments: 1,
  paymentMethod: "pix",
  paymentReferenceCode: "",
};

export function SalesSection({
  customers,
  inventoryBalances,
  products,
}: {
  customers: Customer[];
  inventoryBalances: InventoryBalance[];
  products: Product[];
}) {
  const {
    cancelSale,
    createSale,
    filteredSales,
    paySale,
    selectedStatus,
    setSelectedStatus,
  } = useSales();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canCreateSale = can("sales:create");
  const canPaySale = can("sales:pay");
  const canCancelSale = can("sales:cancel");
  const canAuthorizeDiscount = can("sales:authorize-discount");
  const canAuthorizeOversell = can("sales:authorize-oversell");
  const [form, setForm] = useState<SaleForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const activeCustomers = customers.filter((customer) => customer.active);
  const activeProducts = products.filter((product) => product.isSellable());
  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const stockByProduct = useMemo(
    () =>
      new Map(
        inventoryBalances.map((balance) => [balance.productId, balance.quantity]),
      ),
    [inventoryBalances],
  );
  const subtotal = form.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = Math.max(0, subtotal - form.discountAmount);
  const discountRate = subtotal > 0 ? form.discountAmount / subtotal : 0;
  const needsDiscountAuthorization = discountRate > 0.1;
  const oversellItems = form.items.filter((item) => {
    if (!item.productId) {
      return false;
    }

    return (stockByProduct.get(item.productId) ?? 0) < item.quantity;
  });
  const needsOversellAuthorization = oversellItems.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateSale) {
      setError("Seu perfil nao pode registrar vendas.");
      return;
    }

    if (needsDiscountAuthorization && !canAuthorizeDiscount) {
      setError("Desconto acima do limite exige perfil autorizado.");
      return;
    }

    if (needsOversellAuthorization && !canAuthorizeOversell) {
      setError("Venda acima do estoque exige perfil autorizado.");
      return;
    }

    setError(null);

    try {
      const input = SaleSchema.parse({
        ...form,
        customerId: form.customerId || null,
        discountAuthorizedBy: form.discountAuthorizedBy || null,
        discountReason: form.discountReason || null,
        oversellApprovedBy: form.oversellApprovedBy || null,
        oversellJustification: form.oversellJustification || null,
        payments: [
          {
            amount: total,
            cardBrand: form.paymentCardBrand || null,
            installments: form.paymentInstallments,
            method: form.paymentMethod,
            referenceCode: form.paymentReferenceCode || null,
          },
        ],
      });

      const sale = await createSale.mutateAsync(input);
      recordAudit({
        action: "sale.create",
        description: `Venda ${sale.id} registrada`,
        entity: "sale",
        entityId: sale.id,
        metadata: {
          discountAmount: sale.discountAmount,
          items: sale.items.length,
          paymentMethod: sale.paymentMethod,
          total: sale.total,
        },
      });
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Venda invalida");
    }
  }

  function updateItem(index: number, nextItem: Partial<SaleFormItem>) {
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
      unitPrice: product?.salePrice ?? 0,
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 xl:grid-cols-[420px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-bold text-green-800">Vendas</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Balcao e encomendas
          </h2>
        </div>
        {!canCreateSale ? (
          <PermissionNotice description="Voce pode consultar vendas, mas nao registrar novos atendimentos." />
        ) : null}

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Cliente
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.customerId}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                customerId: event.target.value,
              }))
            }
          >
            <option value="">Consumidor final</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Pagamento
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.paymentMethod}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                paymentMethod: event.target.value as PaymentMethod,
                paymentCardBrand:
                  event.target.value === "card" ? state.paymentCardBrand : "",
                paymentInstallments:
                  event.target.value === "card" ? state.paymentInstallments : 1,
              }))
            }
          >
            <option value="pix">Pix</option>
            <option value="cash">Dinheiro</option>
            <option value="card">Cartao</option>
            <option value="invoice">A prazo</option>
          </select>
        </label>

        {form.paymentMethod !== "cash" ? (
          <Field
            label="Referencia do pagamento"
            value={form.paymentReferenceCode}
            onChange={(paymentReferenceCode) =>
              setForm((state) => ({ ...state, paymentReferenceCode }))
            }
          />
        ) : null}

        {form.paymentMethod === "card" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Bandeira"
              value={form.paymentCardBrand}
              onChange={(paymentCardBrand) =>
                setForm((state) => ({ ...state, paymentCardBrand }))
              }
            />
            <NumberField
              label="Parcelas"
              value={form.paymentInstallments}
              onChange={(paymentInstallments) =>
                setForm((state) => ({ ...state, paymentInstallments }))
              }
            />
          </div>
        ) : null}

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
                      {product.name} · saldo {stockByProduct.get(product.id) ?? 0}
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
                  label="Preco unit."
                  value={item.unitPrice}
                  onChange={(unitPrice) => updateItem(index, { unitPrice })}
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
                { productId: "", quantity: 1, unitPrice: 0 },
              ],
            }))
          }
        >
          Adicionar item
        </button>

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Desconto"
            value={form.discountAmount}
            onChange={(discountAmount) =>
              setForm((state) => ({ ...state, discountAmount }))
            }
          />
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p className="font-bold text-zinc-700">
              Subtotal: R$ {subtotal.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">
              Limite sem autorizacao: R$ {(subtotal * 0.1).toFixed(2)}
            </p>
          </div>
        </div>

        {needsDiscountAuthorization ? (
          <div className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-900">
              Desconto acima de 10%
            </p>
            {!canAuthorizeDiscount ? (
              <p className="text-xs font-semibold text-amber-900">
                Seu perfil nao pode autorizar este desconto.
              </p>
            ) : null}
            <Field
              label="Responsavel"
              value={form.discountAuthorizedBy}
              onChange={(discountAuthorizedBy) =>
                setForm((state) => ({ ...state, discountAuthorizedBy }))
              }
            />
            <Field
              label="Justificativa"
              value={form.discountReason}
              onChange={(discountReason) =>
                setForm((state) => ({ ...state, discountReason }))
              }
            />
          </div>
        ) : null}

        {needsOversellAuthorization ? (
          <div className="grid gap-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-bold text-red-900">
              Venda acima do estoque
            </p>
            <p className="text-xs text-red-800">
              {oversellItems.length} item(ns) excedem o saldo atual.
            </p>
            {!canAuthorizeOversell ? (
              <p className="text-xs font-semibold text-red-900">
                Seu perfil nao pode autorizar venda acima do estoque.
              </p>
            ) : null}
            <Field
              label="Responsavel"
              value={form.oversellApprovedBy}
              onChange={(oversellApprovedBy) =>
                setForm((state) => ({ ...state, oversellApprovedBy }))
              }
            />
            <Field
              label="Justificativa"
              value={form.oversellJustification}
              onChange={(oversellJustification) =>
                setForm((state) => ({ ...state, oversellJustification }))
              }
            />
          </div>
        ) : null}

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Observacoes
          <textarea
            className="min-h-16 rounded-md border border-zinc-300 px-3 py-2"
            value={form.notes}
            onChange={(event) =>
              setForm((state) => ({ ...state, notes: event.target.value }))
            }
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-700">
            Total: R$ {total.toFixed(2)}
          </p>
          <button
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white disabled:bg-zinc-300"
            disabled={
              !canCreateSale ||
              (needsDiscountAuthorization && !canAuthorizeDiscount) ||
              (needsOversellAuthorization && !canAuthorizeOversell)
            }
          >
            Registrar venda
          </button>
        </div>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "paid", "cancelled"] as const).map((status) => (
            <button
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                selectedStatus === status
                  ? "border-green-800 bg-green-50 text-green-900"
                  : "border-zinc-200 text-zinc-600"
              }`}
              key={status}
              onClick={() => setSelectedStatus(status)}
              type="button"
            >
              {getFilterLabel(status)}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Venda</th>
                <th className="px-3 py-2">Itens</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr className="border-t border-zinc-100" key={sale.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-950">
                      {sale.customerId
                        ? customerNames.get(sale.customerId)
                        : "Consumidor final"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {getPaymentLabel(sale.paymentMethod)} ·{" "}
                      {sale.createdAt.toLocaleDateString()}
                    </p>
                    {sale.payments.length > 0 ? (
                      <p className="text-xs text-zinc-500">
                        {sale.payments
                          .map((payment) =>
                            formatPaymentDetail(payment.method, payment.amount),
                          )
                          .join(" / ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {sale.items.map((item) => (
                      <p key={item.id}>
                        {productNames.get(item.productId) ?? "Produto"} ·{" "}
                        {item.quantity} x R$ {item.unitPrice.toFixed(2)}
                      </p>
                    ))}
                  </td>
                  <td className="px-3 py-3 font-semibold text-zinc-800">
                    R$ {sale.total.toFixed(2)}
                    {sale.discountAmount > 0 ? (
                      <p className="text-xs font-medium text-amber-700">
                        Desc. R$ {sale.discountAmount.toFixed(2)}
                      </p>
                    ) : null}
                    <p className="text-xs font-medium text-zinc-500">
                      Margem R$ {sale.grossMargin.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Status status={sale.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {sale.status === "open" || sale.status === "paid" ? (
                      <div className="flex justify-end gap-2">
                        {sale.status === "open" && canPaySale ? (
                          <button
                            className="text-sm font-semibold text-green-800"
                            onClick={async () => {
                              await paySale.mutateAsync(sale.id);
                              recordAudit({
                                action: "sale.pay",
                                description: `Venda ${sale.id} recebida`,
                                entity: "sale",
                                entityId: sale.id,
                                metadata: { total: sale.total },
                              });
                            }}
                          >
                            Receber
                          </button>
                        ) : null}
                        {canCancelSale ? (
                          <button
                            className="text-sm font-semibold text-zinc-500"
                            onClick={async () => {
                              await cancelSale.mutateAsync(sale.id);
                              recordAudit({
                                action: "sale.cancel",
                                description: `Venda ${sale.id} cancelada`,
                                entity: "sale",
                                entityId: sale.id,
                                metadata: { status: sale.status, total: sale.total },
                              });
                            }}
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    ) : null}
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

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        className="rounded-md border border-zinc-300 bg-white px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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

function Status({ status }: { status: SaleStatus }) {
  const label =
    status === "open" ? "Aberta" : status === "paid" ? "Paga" : "Cancelada";
  const tone =
    status === "paid"
      ? "bg-green-50 text-green-800"
      : status === "cancelled"
        ? "bg-zinc-100 text-zinc-500"
        : "bg-amber-50 text-amber-800";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>
      {label}
    </span>
  );
}

function getFilterLabel(status: "all" | SaleStatus) {
  if (status === "all") {
    return "Todas";
  }

  return status === "open" ? "Abertas" : status === "paid" ? "Pagas" : "Canceladas";
}

function getPaymentLabel(paymentMethod: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    card: "Cartao",
    cash: "Dinheiro",
    invoice: "A prazo",
    pix: "Pix",
  };

  return labels[paymentMethod];
}

function formatPaymentDetail(paymentMethod: PaymentMethod, amount: number) {
  return `${getPaymentLabel(paymentMethod)} R$ ${amount.toFixed(2)}`;
}
