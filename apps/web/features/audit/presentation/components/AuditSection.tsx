"use client";

import { AuditActionResult, AuditLog } from "@paobom/domain";
import { useMemo, useState } from "react";

import { useAuditLogs } from "@/features/audit/presentation/hooks/useAuditLogs";

type AuditFilterForm = {
  action: string;
  endDate: string;
  entity: string;
  startDate: string;
  userId: string;
};

const initialFilter: AuditFilterForm = {
  action: "",
  endDate: "",
  entity: "",
  startDate: "",
  userId: "",
};

const entityLabels: Record<string, string> = {
  cash_entry: "Lancamento financeiro",
  cash_register: "Caixa",
  customer: "Cliente",
  customer_interaction: "CRM",
  inventory: "Estoque",
  product: "Produto",
  production_order: "Ordem de producao",
  purchase: "Compra",
  recipe: "Ficha tecnica",
  sale: "Venda",
  supplier: "Fornecedor",
  system: "Sistema",
};

export function AuditSection() {
  const [filterForm, setFilterForm] = useState<AuditFilterForm>(initialFilter);
  const filter = useMemo(
    () => ({
      action: filterForm.action || undefined,
      endDate: parseDateInput(filterForm.endDate, "end"),
      entity: filterForm.entity || undefined,
      startDate: parseDateInput(filterForm.startDate, "start"),
      userId: filterForm.userId || undefined,
    }),
    [
      filterForm.action,
      filterForm.endDate,
      filterForm.entity,
      filterForm.startDate,
      filterForm.userId,
    ],
  );
  const { auditLogs, isLoading } = useAuditLogs(filter);
  const summary = getSummary(auditLogs);
  const users = useMemo(
    () =>
      Array.from(
        new Map(
          auditLogs.map((log) => [
            log.userId,
            {
              id: log.userId,
              name: log.userName,
              role: log.userRole,
            },
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [auditLogs],
  );

  return (
    <section className="brand-card space-y-4 p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="brand-kicker text-sm">Auditoria</p>
          <h2 className="brand-section-title text-xl">
            Trilha operacional
          </h2>
          <p className="brand-muted mt-1 text-xs font-semibold">
            {isLoading ? "Carregando eventos" : `${auditLogs.length} evento(s)`}
          </p>
        </div>
        <AuditFilters
          filterForm={filterForm}
          setFilterForm={setFilterForm}
          users={users}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Eventos" value={String(auditLogs.length)} />
        <Metric label="Sucesso" value={String(summary.success)} />
        <Metric label="Falhas" value={String(summary.failure)} />
        <Metric label="Usuarios" value={String(summary.users)} />
      </div>

      <div className="brand-table">
        <table className="w-full text-left text-sm">
          <thead className="brand-table-header text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Quando</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Acao</th>
              <th className="px-3 py-2">Entidade</th>
              <th className="px-3 py-2">Resultado</th>
              <th className="px-3 py-2">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length ? (
              auditLogs.map((log) => (
                <tr className="border-t border-[#f1dfb5]" key={log.id}>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p className="font-semibold">
                      {log.occurredAt.toLocaleDateString()}
                    </p>
                    <p className="brand-muted text-xs">
                      {log.occurredAt.toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {log.userName}
                    </p>
                    <p className="brand-muted text-xs">{log.userRole}</p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                    {log.action}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p>{getEntityLabel(log.entity)}</p>
                    <p className="brand-muted text-xs">
                      {log.entityId ?? "sem referencia"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <ResultBadge result={log.result} />
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p>{log.description}</p>
                    <p className="brand-muted text-xs">
                      {formatMetadata(log.metadata)}
                    </p>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-[#f1dfb5]">
                <td className="brand-muted px-3 py-4" colSpan={6}>
                  Nenhum evento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditFilters({
  filterForm,
  setFilterForm,
  users,
}: {
  filterForm: AuditFilterForm;
  setFilterForm: (filterForm: AuditFilterForm) => void;
  users: { id: string; name: string; role: string }[];
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Inicio
        <input
          className="brand-input h-9 px-2 text-sm font-semibold"
          max={filterForm.endDate || undefined}
          onChange={(event) =>
            setFilterForm({ ...filterForm, startDate: event.target.value })
          }
          type="date"
          value={filterForm.startDate}
        />
      </label>
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Fim
        <input
          className="brand-input h-9 px-2 text-sm font-semibold"
          min={filterForm.startDate || undefined}
          onChange={(event) =>
            setFilterForm({ ...filterForm, endDate: event.target.value })
          }
          type="date"
          value={filterForm.endDate}
        />
      </label>
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Entidade
        <select
          className="brand-input h-9 px-2 text-sm font-semibold"
          onChange={(event) =>
            setFilterForm({ ...filterForm, entity: event.target.value })
          }
          value={filterForm.entity}
        >
          <option value="">Todas</option>
          {Object.entries(entityLabels).map(([entity, label]) => (
            <option key={entity} value={entity}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Usuario
        <select
          className="brand-input h-9 px-2 text-sm font-semibold"
          onChange={(event) =>
            setFilterForm({ ...filterForm, userId: event.target.value })
          }
          value={filterForm.userId}
        >
          <option value="">Todos</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.role}
            </option>
          ))}
        </select>
      </label>
      <label className="brand-muted grid gap-1 text-xs font-semibold">
        Acao
        <input
          className="brand-input h-9 px-2 text-sm font-semibold"
          onChange={(event) =>
            setFilterForm({ ...filterForm, action: event.target.value })
          }
          placeholder="sale.create"
          value={filterForm.action}
        />
      </label>
      <button
        className="brand-secondary-button h-9 px-3 text-xs"
        onClick={() => setFilterForm(initialFilter)}
        type="button"
      >
        Limpar
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="brand-card-warm p-3">
      <p className="brand-muted text-xs font-semibold">{label}</p>
      <p className="brand-section-title mt-1 text-xl">{value}</p>
    </div>
  );
}

function ResultBadge({ result }: { result: AuditActionResult }) {
  const tone =
    result === "success"
      ? "bg-[#f4f9ec] text-[var(--brand-leaf)]"
      : "bg-red-50 text-red-800";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>
      {result === "success" ? "Sucesso" : "Falha"}
    </span>
  );
}

function getSummary(logs: AuditLog[]) {
  return logs.reduce(
    (summary, log) => ({
      failure: summary.failure + (log.result === "failure" ? 1 : 0),
      success: summary.success + (log.result === "success" ? 1 : 0),
      users: new Set([...summary.userIds, log.userId]).size,
      userIds: new Set([...summary.userIds, log.userId]),
    }),
    {
      failure: 0,
      success: 0,
      users: 0,
      userIds: new Set<string>(),
    },
  );
}

function getEntityLabel(entity: string) {
  return entityLabels[entity] ?? entity;
}

function formatMetadata(metadata: Record<string, string | number | boolean | null>) {
  const entries = Object.entries(metadata);

  if (!entries.length) {
    return "sem metadados";
  }

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
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
