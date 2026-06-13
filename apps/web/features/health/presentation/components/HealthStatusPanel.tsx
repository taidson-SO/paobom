"use client";

import { useSystemHealth } from "@/features/health/presentation/hooks/useSystemHealth";

export function HealthStatusPanel() {
  const health = useSystemHealth();

  return (
    <section className="w-full max-w-3xl rounded-lg border border-zinc-300 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase text-green-800">
        Fundacao arquitetural
      </p>
      <h1 className="mt-3 text-3xl font-bold text-zinc-950">Paobom ERP</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Base tecnica pronta para evoluir os dominios de compras, estoque,
        producao, caixa, clientes, dashboard e relatorios.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${
            health.isOperational ? "bg-green-600" : "bg-amber-500"
          }`}
        />
        <span className="font-semibold capitalize text-zinc-900">
          {health.isLoading ? "Verificando..." : health.status}
        </span>
      </div>

      <button
        className="mt-6 rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white"
        type="button"
        onClick={health.toggleDetails}
      >
        Detalhes
      </button>

      {health.detailsVisible ? (
        <p className="mt-4 text-sm text-zinc-500">
          Ultima verificacao: {health.checkedAt?.toLocaleString() ?? "-"}
        </p>
      ) : null}
    </section>
  );
}
