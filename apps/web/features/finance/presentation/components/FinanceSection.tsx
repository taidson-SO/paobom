"use client";

import { CashEntryStatus, CashEntryType } from "@paobom/domain";
import { FormEvent, useState } from "react";

import { useFinance } from "@/features/finance/presentation/hooks/useFinance";
import { CashEntrySchema } from "@/features/finance/schemas/FinanceSchema";

type FinanceForm = {
  amount: number;
  category: string;
  description: string;
  dueDate: string;
  type: CashEntryType;
};

const initialForm: FinanceForm = {
  amount: 0,
  category: "Vendas",
  description: "",
  dueDate: new Date().toISOString().slice(0, 10),
  type: "income",
};

export function FinanceSection() {
  const {
    cancelCashEntry,
    filteredEntries,
    registerCashEntry,
    selectedStatus,
    setSelectedStatus,
    settleCashEntry,
    summary,
  } = useFinance();
  const [form, setForm] = useState<FinanceForm>(initialForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const input = CashEntrySchema.parse(form);

      await registerCashEntry.mutateAsync(input);
      setForm(initialForm);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Lancamento financeiro invalido",
      );
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 xl:grid-cols-[380px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-bold text-green-800">Financeiro</p>
          <h2 className="text-xl font-bold text-zinc-950">Fluxo de caixa</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Saldo realizado" value={summary.balance} />
          <Metric label="Saldo projetado" value={summary.projectedBalance} />
          <Metric label="Entradas pagas" value={summary.income} />
          <Metric label="Saidas pagas" value={summary.expense} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Tipo
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.type}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  type: event.target.value as CashEntryType,
                }))
              }
            >
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
          </label>

          <NumberField
            label="Valor"
            value={form.amount}
            onChange={(amount) => setForm((state) => ({ ...state, amount }))}
          />
        </div>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Categoria
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.category}
            onChange={(event) =>
              setForm((state) => ({ ...state, category: event.target.value }))
            }
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Descricao
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.description}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                description: event.target.value,
              }))
            }
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Vencimento
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm((state) => ({ ...state, dueDate: event.target.value }))
            }
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-600">
            Pendente: R$ {summary.pendingIncome.toFixed(2)} / R${" "}
            {summary.pendingExpense.toFixed(2)}
          </p>
          <button className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white">
            Lancar
          </button>
        </div>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "settled"] as const).map((status) => (
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
              {status === "all" ? "Todos" : status === "pending" ? "Pendentes" : "Baixados"}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Lancamento</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr className="border-t border-zinc-100" key={entry.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-950">
                      {entry.description}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.category} · venc. {entry.dueDate.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-zinc-800">
                    {entry.type === "income" ? "+" : "-"} R${" "}
                    {entry.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <Status status={entry.status} type={entry.type} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {entry.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-sm font-semibold text-green-800"
                          onClick={() => settleCashEntry.mutate(entry.id)}
                        >
                          Baixar
                        </button>
                        <button
                          className="text-sm font-semibold text-zinc-500"
                          onClick={() => cancelCashEntry.mutate(entry.id)}
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="text-lg font-bold text-zinc-950">R$ {value.toFixed(2)}</p>
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

function Status({
  status,
  type,
}: {
  status: CashEntryStatus;
  type: CashEntryType;
}) {
  const label =
    status === "pending" ? "Pendente" : status === "settled" ? "Baixado" : "Cancelado";
  const tone =
    status === "settled"
      ? type === "income"
        ? "bg-green-50 text-green-800"
        : "bg-blue-50 text-blue-800"
      : status === "cancelled"
        ? "bg-zinc-100 text-zinc-500"
        : "bg-amber-50 text-amber-800";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>
      {label}
    </span>
  );
}
