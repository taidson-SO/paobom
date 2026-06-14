"use client";

import { Customer, PaymentMethod, Product, SaleStatus } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useSales } from "@/features/sales/presentation/hooks/useSales";
import { SaleSchema } from "@/features/sales/schemas/SalesSchema";

type SaleFormItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

type SaleForm = {
  customerId: string;
  items: SaleFormItem[];
  notes: string;
  paymentMethod: PaymentMethod;
};

const initialForm: SaleForm = {
  customerId: "",
  items: [{ productId: "", quantity: 1, unitPrice: 0 }],
  notes: "",
  paymentMethod: "pix",
};

export function SalesSection({
  customers,
  products,
}: {
  customers: Customer[];
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
  const [form, setForm] = useState<SaleForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const activeCustomers = customers.filter((customer) => customer.active);
  const activeProducts = products.filter((product) => product.active);
  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const total = form.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const input = SaleSchema.parse({
        ...form,
        customerId: form.customerId || null,
      });

      await createSale.mutateAsync(input);
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
              }))
            }
          >
            <option value="pix">Pix</option>
            <option value="cash">Dinheiro</option>
            <option value="card">Cartao</option>
            <option value="invoice">A prazo</option>
          </select>
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
          <button className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white">
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
                    <p className="text-xs font-medium text-zinc-500">
                      Margem R$ {sale.grossMargin.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Status status={sale.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {sale.status === "open" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-sm font-semibold text-green-800"
                          onClick={() => paySale.mutate(sale.id)}
                        >
                          Receber
                        </button>
                        <button
                          className="text-sm font-semibold text-zinc-500"
                          onClick={() => cancelSale.mutate(sale.id)}
                        >
                          Cancelar
                        </button>
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
