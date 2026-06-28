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
      <section className="brand-card space-y-4 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="brand-kicker text-sm">Relatorios</p>
            <h2 className="brand-section-title text-xl">
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
    <section className="brand-card space-y-4 p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="brand-kicker text-sm">Relatorios</p>
          <h2 className="brand-section-title text-xl">
            Analise consolidada por periodo
          </h2>
          <p className="brand-muted mt-1 text-xs font-semibold">
            {formatPeriodLabel(reports.period)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <PeriodControls
            periodForm={periodForm}
            setPeriodForm={setPeriodForm}
          />
          <ExportControls reports={reports} />
          <p className="brand-muted text-xs font-semibold">
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

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="Resultado liquido"
          value={`R$ ${reports.financial.netResult.toFixed(2)}`}
        />
        <SummaryCard
          label="Desp. operacionais"
          value={`R$ ${reports.financial.operatingExpenses.toFixed(2)}`}
        />
        <SummaryCard
          label="Entradas pendentes"
          value={`R$ ${reports.cashFlow.pendingIncome.toFixed(2)}`}
        />
        <SummaryCard
          label="Saidas pendentes"
          value={`R$ ${reports.cashFlow.pendingExpense.toFixed(2)}`}
        />
      </div>

      <div className="brand-table">
        <div className="brand-table-header px-3 py-2">
          <h3 className="brand-section-title text-sm">
            Validacao contabil basica
          </h3>
        </div>
        <div className="divide-y divide-[#f1dfb5]">
          {reports.financial.validations.map((validation) => (
            <div
              className="grid gap-2 px-3 py-3 md:grid-cols-[120px_180px_1fr]"
              key={validation.id}
            >
              <span
                className={`text-xs font-bold uppercase ${getValidationTone(validation.level)}`}
              >
                {getValidationLabel(validation.level)}
              </span>
              <p className="brand-section-title text-sm">
                {validation.label}
              </p>
              <p className="brand-muted text-sm">{validation.message}</p>
            </div>
          ))}
        </div>
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
    <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-end">
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Inicio
        <input
          className="brand-input h-9 min-w-0 px-2 text-sm font-semibold"
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
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Fim
        <input
          className="brand-input h-9 min-w-0 px-2 text-sm font-semibold"
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
        className="brand-secondary-button h-9 px-3 text-xs"
        onClick={() => setPeriodForm(getCurrentMonthPeriod())}
        type="button"
      >
        Mes atual
      </button>
      <button
        className="brand-secondary-button h-9 px-3 text-xs"
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
    <div className="brand-card-warm p-3">
      <p className="brand-muted text-xs font-semibold">{label}</p>
      <p className="brand-section-title mt-1 text-xl">{value}</p>
    </div>
  );
}

function ExportControls({
  reports,
}: {
  reports: NonNullable<ReturnType<typeof useReports>["reports"]>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="brand-secondary-button h-9 px-3 text-xs"
        onClick={() => downloadText("paobom-relatorio.json", JSON.stringify(reports, null, 2))}
        type="button"
      >
        JSON
      </button>
      <button
        className="brand-secondary-button h-9 px-3 text-xs"
        onClick={() => downloadText("paobom-relatorio.csv", buildReportsCsv(reports))}
        type="button"
      >
        CSV
      </button>
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

function getValidationLabel(level: "critical" | "ok" | "warning") {
  const labels = {
    critical: "Critico",
    ok: "OK",
    warning: "Atencao",
  };

  return labels[level];
}

function getValidationTone(level: "critical" | "ok" | "warning") {
  const tones = {
    critical: "text-red-700",
    ok: "text-[var(--brand-leaf)]",
    warning: "text-[var(--brand-caramel)]",
  };

  return tones[level];
}

function buildReportsCsv(
  reports: NonNullable<ReturnType<typeof useReports>["reports"]>,
) {
  const rows = [
    ["secao", "indicador", "quantidade", "valor"],
    ["vendas", "receita", "", reports.sales.totalRevenue.toFixed(2)],
    ["vendas", "custo", "", reports.sales.totalCost.toFixed(2)],
    ["vendas", "margem", "", reports.sales.grossMargin.toFixed(2)],
    ["financeiro", "resultado_liquido", "", reports.financial.netResult.toFixed(2)],
    [
      "financeiro",
      "despesas_operacionais",
      "",
      reports.financial.operatingExpenses.toFixed(2),
    ],
    [
      "financeiro",
      "perdas_estoque",
      "",
      reports.financial.inventoryLossCost.toFixed(2),
    ],
    ["caixa", "saldo_realizado", "", reports.cashFlow.balance.toFixed(2)],
    ["caixa", "saldo_projetado", "", reports.cashFlow.projectedBalance.toFixed(2)],
    ...tableRows("vendas_por_status", reports.sales.byStatus),
    ...tableRows("vendas_por_pagamento", reports.sales.byPaymentMethod),
    ...tableRows("caixa_por_tipo", reports.cashFlow.byType),
    ...tableRows("compras_por_status", reports.purchases.byStatus),
    ...tableRows("producao_por_status", reports.production.ordersByStatus),
    ...tableRows("estoque_movimentos", reports.inventory.movementsByType),
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function tableRows(section: string, rows: ReportTableRow[]) {
  return rows.map((row) => [
    section,
    row.label,
    row.quantity.toString(),
    row.amount.toFixed(2),
  ]);
}

function escapeCsv(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReportTable({
  rows,
  title,
}: {
  rows: ReportTableRow[];
  title: string;
}) {
  return (
    <div className="brand-table">
      <div className="brand-table-header px-3 py-2">
        <h3 className="brand-section-title text-sm">{title}</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="brand-table-header text-xs uppercase">
          <tr>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Qtd.</th>
            <th className="px-3 py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr className="border-t border-[#f1dfb5]" key={row.label}>
                <td className="brand-section-title px-3 py-2 font-semibold">
                  {row.label}
                </td>
                <td className="px-3 py-2 text-[var(--brand-brown)]">{row.quantity}</td>
                <td className="px-3 py-2 text-[var(--brand-brown)]">
                  R$ {row.amount.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-[#f1dfb5]">
              <td className="brand-muted px-3 py-3" colSpan={3}>
                Sem dados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
