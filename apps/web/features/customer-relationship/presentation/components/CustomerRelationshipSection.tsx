"use client";

import {
  Customer,
  CustomerInteractionStatus,
  CustomerInteractionType,
} from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useCustomerRelationship } from "@/features/customer-relationship/presentation/hooks/useCustomerRelationship";
import { CustomerInteractionSchema } from "@/features/customer-relationship/schemas/CustomerRelationshipSchema";

type RelationshipForm = {
  customerId: string;
  nextContactAt: string;
  notes: string;
  occurredAt: string;
  subject: string;
  type: CustomerInteractionType;
};

const initialForm: RelationshipForm = {
  customerId: "",
  nextContactAt: "",
  notes: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  subject: "",
  type: "follow_up",
};

export function CustomerRelationshipSection({
  customers,
}: {
  customers: Customer[];
}) {
  const {
    cancelInteraction,
    completeInteraction,
    filteredInteractions,
    registerInteraction,
    selectedStatus,
    setSelectedStatus,
    summary,
  } = useCustomerRelationship();
  const { can } = usePermissionSession();
  const canManageCrm = can("crm:manage");
  const [form, setForm] = useState<RelationshipForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const activeCustomers = customers.filter((customer) => customer.active);
  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageCrm) {
      setError("Seu perfil nao pode registrar interacoes de CRM.");
      return;
    }

    setError(null);

    try {
      const input = CustomerInteractionSchema.parse({
        ...form,
        nextContactAt: form.nextContactAt || null,
      });

      await registerInteraction.mutateAsync(input);
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interacao invalida");
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 xl:grid-cols-[380px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-bold text-green-800">CRM</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Historico e retornos
          </h2>
        </div>
        {!canManageCrm ? (
          <PermissionNotice description="Voce pode consultar o relacionamento, mas nao registrar ou alterar interacoes." />
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Interacoes" value={summary.totalInteractions} />
          <Metric label="Retornos abertos" value={summary.openFollowUps} />
          <Metric label="Concluidas" value={summary.completedInteractions} />
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold text-zinc-500">
              Proximo contato
            </p>
            <p className="text-sm font-bold text-zinc-950">
              {summary.nextContactAt
                ? summary.nextContactAt.toLocaleDateString()
                : "Sem agenda"}
            </p>
          </div>
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
            <option value="">Selecione</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Tipo
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.type}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  type: event.target.value as CustomerInteractionType,
                }))
              }
            >
              <option value="follow_up">Retorno</option>
              <option value="order">Encomenda</option>
              <option value="feedback">Feedback</option>
              <option value="complaint">Reclamacao</option>
              <option value="campaign">Campanha</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Data
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              type="date"
              value={form.occurredAt}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  occurredAt: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Assunto
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.subject}
            onChange={(event) =>
              setForm((state) => ({ ...state, subject: event.target.value }))
            }
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Proximo contato
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            type="date"
            value={form.nextContactAt}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                nextContactAt: event.target.value,
              }))
            }
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Observacoes
          <textarea
            className="min-h-20 rounded-md border border-zinc-300 px-3 py-2"
            value={form.notes}
            onChange={(event) =>
              setForm((state) => ({ ...state, notes: event.target.value }))
            }
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-600">
            Feedbacks: {summary.interactionsByType.feedback}
          </p>
          <button
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white disabled:bg-zinc-300"
            disabled={!canManageCrm}
          >
            Registrar
          </button>
        </div>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "done", "cancelled"] as const).map((status) => (
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
              {getStatusFilterLabel(status)}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Interacao</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredInteractions.map((interaction) => (
                <tr className="border-t border-zinc-100" key={interaction.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-950">
                      {customerNames.get(interaction.customerId) ?? "Cliente"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {interaction.occurredAt.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    <p className="font-semibold">{interaction.subject}</p>
                    <p className="text-xs text-zinc-500">
                      {getTypeLabel(interaction.type)}
                      {interaction.nextContactAt
                        ? ` · retorno ${interaction.nextContactAt.toLocaleDateString()}`
                        : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Status status={interaction.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {interaction.status === "open" && canManageCrm ? (
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-sm font-semibold text-green-800"
                          onClick={() =>
                            completeInteraction.mutate(interaction.id)
                          }
                        >
                          Concluir
                        </button>
                        <button
                          className="text-sm font-semibold text-zinc-500"
                          onClick={() =>
                            cancelInteraction.mutate(interaction.id)
                          }
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
      <p className="text-lg font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function Status({ status }: { status: CustomerInteractionStatus }) {
  const label =
    status === "open" ? "Aberta" : status === "done" ? "Concluida" : "Cancelada";
  const tone =
    status === "done"
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

function getStatusFilterLabel(
  status: "all" | CustomerInteractionStatus,
) {
  if (status === "all") {
    return "Todas";
  }

  return status === "open"
    ? "Abertas"
    : status === "done"
      ? "Concluidas"
      : "Canceladas";
}

function getTypeLabel(type: CustomerInteractionType) {
  const labels: Record<CustomerInteractionType, string> = {
    campaign: "Campanha",
    complaint: "Reclamacao",
    feedback: "Feedback",
    follow_up: "Retorno",
    order: "Encomenda",
  };

  return labels[type];
}
