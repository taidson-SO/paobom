"use client";

import { DashboardAlertLevel } from "@paobom/domain";

import { useDashboard } from "@/features/dashboard/presentation/hooks/useDashboard";

export function DashboardSection() {
  const { dashboard } = useDashboard();

  if (!dashboard) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm font-bold text-green-800">Dashboard</p>
        <h2 className="text-xl font-bold text-zinc-950">Carregando indicadores</h2>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-green-800">Dashboard</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Saude operacional
          </h2>
        </div>
        <p className="text-xs font-semibold text-zinc-500">
          Atualizado {dashboard.generatedAt.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          label="Receita realizada"
          value={`R$ ${dashboard.sales.revenue.toFixed(2)}`}
          hint={`${dashboard.sales.paidSales} venda(s) paga(s)`}
        />
        <Metric
          label="Margem bruta"
          value={`R$ ${dashboard.sales.grossMargin.toFixed(2)}`}
          hint={`Ticket R$ ${dashboard.sales.averageTicket.toFixed(2)}`}
        />
        <Metric
          label="Caixa projetado"
          value={`R$ ${dashboard.cash.projectedBalance.toFixed(2)}`}
          hint={`Realizado R$ ${dashboard.cash.balance.toFixed(2)}`}
        />
        <Metric
          label="Valor em estoque"
          value={`R$ ${dashboard.inventory.estimatedValue.toFixed(2)}`}
          hint={`${dashboard.inventory.productsBelowMinimum} abaixo do minimo`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 md:grid-cols-4">
          <MiniMetric
            label="Compras abertas"
            value={dashboard.operations.openPurchases}
          />
          <MiniMetric
            label="Compras recebidas"
            value={dashboard.operations.receivedPurchases}
          />
          <MiniMetric
            label="Ordens producao"
            value={dashboard.operations.productionOrders}
          />
          <MiniMetric
            label="Movimentos estoque"
            value={dashboard.inventory.totalMovements}
          />
        </div>

        <div className="rounded-md border border-zinc-200">
          <div className="border-b border-zinc-200 px-3 py-2">
            <p className="text-sm font-bold text-zinc-800">Alertas</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {dashboard.alerts.length ? (
              dashboard.alerts.map((alert) => (
                <div className="px-3 py-2" key={alert.id}>
                  <p
                    className={`text-sm font-bold ${getAlertTone(alert.level)}`}
                  >
                    {alert.title}
                  </p>
                  <p className="text-xs leading-5 text-zinc-600">
                    {alert.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-3 py-4 text-sm font-semibold text-zinc-500">
                Nenhum alerta operacional
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  hint,
  label,
  value,
}: {
  hint: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-500">{hint}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function getAlertTone(level: DashboardAlertLevel) {
  if (level === "critical") {
    return "text-red-700";
  }

  if (level === "warning") {
    return "text-amber-700";
  }

  return "text-blue-700";
}
