"use client";

import {
  DashboardAlertLevel,
  DashboardFocusPriority,
  DashboardHealthStatus,
} from "@paobom/domain";
import { useMemo, useState } from "react";

import { useDashboard } from "@/features/dashboard/presentation/hooks/useDashboard";

export function DashboardSection() {
  const [periodForm, setPeriodForm] = useState(() => getCurrentMonthPeriod());
  const period = useMemo(
    () => ({
      endDate: parseDateInput(periodForm.endDate, "end"),
      startDate: parseDateInput(periodForm.startDate, "start"),
    }),
    [periodForm.endDate, periodForm.startDate],
  );
  const { dashboard } = useDashboard(period);

  if (!dashboard) {
    return (
      <section className="brand-card space-y-4 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="brand-kicker text-sm">Dashboard</p>
            <h2 className="brand-section-title text-xl">
              Carregando indicadores
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
          <p className="brand-kicker text-sm">Dashboard</p>
          <h2 className="brand-section-title text-xl">
            Painel executivo
          </h2>
          <p className="brand-muted mt-1 text-xs font-semibold">
            {formatPeriodLabel(dashboard.period)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <PeriodControls
            periodForm={periodForm}
            setPeriodForm={setPeriodForm}
          />
          <p className="brand-muted text-xs font-semibold">
            Atualizado {dashboard.generatedAt.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <HealthPanel
          score={dashboard.executive.healthScore}
          status={dashboard.executive.status}
        />
        <Metric
          hint={`${(dashboard.executive.netResultRate * 100).toFixed(1)}% sobre a receita`}
          label="Resultado liquido"
          tone={dashboard.executive.netResult < 0 ? "danger" : "success"}
          value={formatCurrency(dashboard.executive.netResult)}
        />
        <Metric
          hint={`${dashboard.sales.paidSales} venda(s) pagas - ticket ${formatCurrency(dashboard.sales.averageTicket)}`}
          label="Receita realizada"
          value={formatCurrency(dashboard.sales.revenue)}
        />
        <Metric
          hint={`Realizado ${formatCurrency(dashboard.cash.balance)}`}
          label="Caixa projetado"
          tone={dashboard.cash.projectedBalance < 0 ? "danger" : "neutral"}
          value={formatCurrency(dashboard.cash.projectedBalance)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          hint={`${(dashboard.sales.grossMarginRate * 100).toFixed(1)}% de margem`}
          label="Margem bruta"
          value={formatCurrency(dashboard.sales.grossMargin)}
        />
        <Metric
          hint={`${formatCurrency(dashboard.executive.operatingExpenses)} em despesas baixadas`}
          label="Despesas operacionais"
          tone="warning"
          value={formatCurrency(dashboard.executive.operatingExpenses)}
        />
        <Metric
          hint={`${dashboard.inventory.lossMovements} movimentacoes de perda`}
          label="Perdas de estoque"
          tone={dashboard.inventory.lossCost > 0 ? "warning" : "success"}
          value={formatCurrency(dashboard.inventory.lossCost)}
        />
        <Metric
          hint={`${dashboard.inventory.productsBelowMinimum} abaixo do minimo`}
          label="Valor em estoque"
          value={formatCurrency(dashboard.inventory.estimatedValue)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MiniMetric
              label="Compras abertas"
              value={dashboard.operations.openPurchases}
            />
            <MiniMetric
              label="Recebimento compras"
              suffix="%"
              value={dashboard.executive.purchaseReceivingRate * 100}
            />
            <MiniMetric
              label="Conclusao producao"
              suffix="%"
              value={dashboard.executive.productionCompletionRate * 100}
            />
            <MiniMetric
              label="Movimentos estoque"
              value={dashboard.inventory.totalMovements}
            />
          </div>

          <div className="brand-table">
            <div className="brand-table-header px-3 py-2">
              <h3 className="text-sm font-bold">
                Focos executivos
              </h3>
            </div>
            <div className="divide-y divide-[#f1dfb5]">
              {dashboard.focusAreas.length ? (
                dashboard.focusAreas.map((focus) => (
                  <div
                    className="grid gap-2 px-3 py-3 md:grid-cols-[140px_1fr_120px] md:items-center"
                    key={focus.id}
                  >
                    <span
                      className={`text-xs font-bold uppercase ${getPriorityTone(focus.priority)}`}
                    >
                      {getPriorityLabel(focus.priority)}
                    </span>
                    <div>
                      <p className="brand-section-title text-sm">
                        {focus.title}
                      </p>
                      <p className="brand-muted text-xs leading-5">
                        {focus.description}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[var(--brand-brown)] md:text-right">
                      {focus.metric}
                    </p>
                  </div>
                ))
              ) : (
                <p className="brand-muted px-3 py-4 text-sm font-semibold">
                  Nenhum foco critico para o periodo
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <ExecutiveSnapshot
            cancelledProductions={dashboard.operations.cancelledProductions}
            cancelledSales={dashboard.sales.cancelledSales}
            discountTotal={dashboard.sales.discountTotal}
            openSales={dashboard.sales.openSales}
          />
          <AlertsPanel alerts={dashboard.alerts} />
        </aside>
      </div>
    </section>
  );
}

type PeriodForm = {
  endDate: string;
  startDate: string;
};

type MetricTone = "danger" | "neutral" | "success" | "warning";

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

function HealthPanel({
  score,
  status,
}: {
  score: number;
  status: DashboardHealthStatus;
}) {
  return (
    <div className={`rounded-md border p-3 ${getHealthPanelTone(status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">Score executivo</p>
          <p className="mt-1 text-3xl font-bold">{score}</p>
        </div>
        <span className="rounded-full border border-current px-2 py-1 text-xs font-bold uppercase">
          {getHealthStatusLabel(status)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-current"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function Metric({
  hint,
  label,
  tone = "neutral",
  value,
}: {
  hint: string;
  label: string;
  tone?: MetricTone;
  value: string;
}) {
  return (
    <div className={`rounded-md border p-3 shadow-sm ${getMetricTone(tone)}`}>
      <p className="brand-muted text-xs font-semibold">
        {label}
      </p>
      <p className="brand-section-title mt-1 text-2xl">
        {value}
      </p>
      <p className="brand-muted mt-1 text-xs font-medium">
        {hint}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  suffix = "",
  value,
}: {
  label: string;
  suffix?: string;
  value: number;
}) {
  return (
    <div className="brand-card-warm p-3">
      <p className="brand-muted text-xs font-semibold">
        {label}
      </p>
      <p className="brand-section-title mt-1 text-xl">
        {suffix === "%" ? value.toFixed(0) : value}
        {suffix}
      </p>
    </div>
  );
}

function ExecutiveSnapshot({
  cancelledProductions,
  cancelledSales,
  discountTotal,
  openSales,
}: {
  cancelledProductions: number;
  cancelledSales: number;
  discountTotal: number;
  openSales: number;
}) {
  const rows = [
    ["Vendas em aberto", openSales.toString()],
    ["Vendas canceladas", cancelledSales.toString()],
    ["Descontos concedidos", formatCurrency(discountTotal)],
    ["Producoes canceladas", cancelledProductions.toString()],
  ];

  return (
    <div className="brand-table">
      <div className="brand-table-header px-3 py-2">
        <h3 className="text-sm font-bold">
          Resumo de controle
        </h3>
      </div>
      <div className="divide-y divide-[#f1dfb5]">
        {rows.map(([label, value]) => (
          <div
            className="flex items-center justify-between gap-3 px-3 py-2"
            key={label}
          >
            <p className="brand-muted text-xs font-semibold">
              {label}
            </p>
            <p className="brand-section-title text-sm">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsPanel({
  alerts,
}: {
  alerts: {
    description: string;
    id: string;
    level: DashboardAlertLevel;
    title: string;
  }[];
}) {
  return (
    <div className="brand-table">
      <div className="brand-table-header px-3 py-2">
        <h3 className="text-sm font-bold">Alertas</h3>
      </div>
      <div className="divide-y divide-[#f1dfb5]">
        {alerts.length ? (
          alerts.map((alert) => (
            <div className="px-3 py-2" key={alert.id}>
              <p className={`text-sm font-bold ${getAlertTone(alert.level)}`}>
                {alert.title}
              </p>
              <p className="brand-muted text-xs leading-5">
                {alert.description}
              </p>
            </div>
          ))
        ) : (
          <p className="brand-muted px-3 py-4 text-sm font-semibold">
            Nenhum alerta executivo
          </p>
        )}
      </div>
    </div>
  );
}

function getAlertTone(level: DashboardAlertLevel) {
  if (level === "critical") {
    return "text-red-700";
  }

  if (level === "warning") {
    return "text-[var(--brand-caramel)]";
  }

  return "text-[var(--brand-leaf)]";
}

function getPriorityLabel(priority: DashboardFocusPriority) {
  if (priority === "high") {
    return "Alta";
  }

  if (priority === "medium") {
    return "Media";
  }

  return "Baixa";
}

function getPriorityTone(priority: DashboardFocusPriority) {
  if (priority === "high") {
    return "text-red-700";
  }

  if (priority === "medium") {
    return "text-[var(--brand-caramel)]";
  }

  return "text-[var(--brand-leaf)]";
}

function getHealthStatusLabel(status: DashboardHealthStatus) {
  if (status === "critical") {
    return "Critico";
  }

  if (status === "attention") {
    return "Atencao";
  }

  return "Saudavel";
}

function getHealthPanelTone(status: DashboardHealthStatus) {
  if (status === "critical") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "attention") {
    return "border-[#e7b76a] bg-[#fff4cf] text-[var(--brand-caramel)]";
  }

  return "border-[#c4d8a8] bg-[#f4f9ec] text-[var(--brand-leaf)]";
}

function getMetricTone(tone: MetricTone) {
  if (tone === "danger") {
    return "border-red-200 bg-red-50";
  }

  if (tone === "success") {
    return "border-[#c4d8a8] bg-[#f4f9ec]";
  }

  if (tone === "warning") {
    return "border-[#e7b76a] bg-[#fff4cf]";
  }

  return "border-[var(--brand-line)] bg-[var(--brand-cream)]";
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

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}
