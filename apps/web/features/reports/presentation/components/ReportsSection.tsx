"use client";

import { ReportTableRow } from "@paobom/domain";
import { useMemo, useState } from "react";

import { useReports } from "@/features/reports/presentation/hooks/useReports";

export function ReportsSection() {
  const [periodForm, setPeriodForm] = useState(() => getCurrentMonthPeriod());
  const period = useMemo(
    () => ({
      endDate: parseDateInput(periodForm.endDate, "end"),
      startDate: parseDateInput(periodForm.startDate, "start"),
    }),
    [periodForm.endDate, periodForm.startDate],
  );
  const { reports } = useReports(period);

  if (!reports) {
    return (
      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold text-green-800">Relatorios</p>
            <h2 className="text-xl font-bold text-zinc-950">
              Carregando dados
            </h2>
          </div>
          <PeriodControls
            periodForm={periodForm}
            setPeriodForm={setPeriodForm}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-green-800">Relatorios</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Analise consolidada por periodo
          </h2>
          <p className="mt-1 text-xs font-semibold text-zinc-500">
            {formatPeriodLabel(reports.period)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <PeriodControls
            periodForm={periodForm}
            setPeriodForm={setPeriodForm}
          />
          <p className="text-xs font-semibold text-zinc-500">
            Gerado {reports.generatedAt.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <SummaryCard
          label="Receita"
          value={`R$ ${reports.sales.totalRevenue.toFixed(2)}`}
        />
        <SummaryCard
          label="Custo vendas"
          value={`R$ ${reports.sales.totalCost.toFixed(2)}`}
        />
        <SummaryCard
          label="Margem"
          value={`${(reports.sales.grossMarginRate * 100).toFixed(1)}%`}
        />
        <SummaryCard
          label="Custo unit. prod."
          value={`R$ ${reports.production.averageUnitCost.toFixed(2)}`}
        />
        <SummaryCard
          label="Estoque"
          value={`R$ ${reports.inventory.estimatedValue.toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportTable
          rows={reports.sales.byStatus}
          title="Vendas por status"
        />
        <ReportTable
          rows={reports.sales.byPaymentMethod}
          title="Vendas por pagamento"
        />
        <ReportTable
          rows={reports.sales.lowMarginProducts}
          title="Produtos com margem baixa"
        />
        <ReportTable
          rows={reports.cashFlow.byType}
          title="Caixa por tipo"
        />
        <ReportTable
          rows={reports.cashFlow.byStatus}
          title="Caixa por status"
        />
        <ReportTable
          rows={reports.purchases.byStatus}
          title="Compras por status"
        />
        <ReportTable
          rows={reports.production.ordersByStatus}
          title="Producao por status"
        />
        <ReportTable
          rows={reports.inventory.movementsByType}
          title="Movimentos de estoque"
        />
        <ReportTable
          rows={reports.inventory.belowMinimum}
          title="Estoque abaixo do minimo"
        />
      </div>
    </section>
  );
}

type PeriodForm = {
  endDate: string;
  startDate: string;
};

function PeriodControls({
  periodForm,
  setPeriodForm,
}: {
  periodForm: PeriodForm;
  setPeriodForm: (periodForm: PeriodForm) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-semibold text-zinc-600">
        Inicio
        <input
          className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-800 outline-none focus:border-green-700"
          max={periodForm.endDate || undefined}
          onChange={(event) =>
            setPeriodForm({
              ...periodForm,
              startDate: event.target.value,
            })
          }
          type="date"
          value={periodForm.startDate}
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-zinc-600">
        Fim
        <input
          className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-800 outline-none focus:border-green-700"
          min={periodForm.startDate || undefined}
          onChange={(event) =>
            setPeriodForm({
              ...periodForm,
              endDate: event.target.value,
            })
          }
          type="date"
          value={periodForm.endDate}
        />
      </label>
      <button
        className="h-9 rounded-md border border-zinc-300 px-3 text-xs font-bold text-zinc-700 hover:border-green-700 hover:text-green-800"
        onClick={() => setPeriodForm(getCurrentMonthPeriod())}
        type="button"
      >
        Mes atual
      </button>
      <button
        className="h-9 rounded-md border border-zinc-300 px-3 text-xs font-bold text-zinc-700 hover:border-green-700 hover:text-green-800"
        onClick={() => setPeriodForm({ endDate: "", startDate: "" })}
        type="button"
      >
        Tudo
      </button>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function getCurrentMonthPeriod(): PeriodForm {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    endDate: formatDateInput(today),
    startDate: formatDateInput(firstDay),
  };
}

function parseDateInput(value: string, boundary: "end" | "start") {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPeriodLabel(period: {
  endDate: Date | null;
  startDate: Date | null;
}) {
  if (!period.startDate && !period.endDate) {
    return "Todos os periodos";
  }

  if (period.startDate && period.endDate) {
    return `${period.startDate.toLocaleDateString()} ate ${period.endDate.toLocaleDateString()}`;
  }

  if (period.startDate) {
    return `A partir de ${period.startDate.toLocaleDateString()}`;
  }

  return `Ate ${period.endDate?.toLocaleDateString()}`;
}

function ReportTable({
  rows,
  title,
}: {
  rows: ReportTableRow[];
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200">
      <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Qtd.</th>
            <th className="px-3 py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr className="border-t border-zinc-100" key={row.label}>
                <td className="px-3 py-2 font-semibold text-zinc-800">
                  {row.label}
                </td>
                <td className="px-3 py-2 text-zinc-700">{row.quantity}</td>
                <td className="px-3 py-2 text-zinc-700">
                  R$ {row.amount.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-zinc-100">
              <td className="px-3 py-3 text-zinc-500" colSpan={3}>
                Sem dados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
