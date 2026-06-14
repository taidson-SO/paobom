"use client";

import { ReportTableRow } from "@paobom/domain";

import { useReports } from "@/features/reports/presentation/hooks/useReports";

export function ReportsSection() {
  const { reports } = useReports();

  if (!reports) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm font-bold text-green-800">Relatorios</p>
        <h2 className="text-xl font-bold text-zinc-950">Carregando dados</h2>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-green-800">Relatorios</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Analise consolidada
          </h2>
        </div>
        <p className="text-xs font-semibold text-zinc-500">
          Gerado {reports.generatedAt.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
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
