"use client";

import {
  Customer,
  CustomerInteractionStatus,
  CustomerInteractionType,
} from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
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
  const { recordAudit } = useAuditRecorder();
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

      const interaction = await registerInteraction.mutateAsync(input);
      recordAudit({
        action: "customer_interaction.create",
        description: `Interacao ${interaction.subject} registrada`,
        entity: "customer_interaction",
        entityId: interaction.id,
        metadata: {
          customerId: interaction.customerId,
          type: interaction.type,
        },
      });
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interacao invalida");
    }
  }

  return (
    <section className="brand-card grid gap-4 p-4 xl:grid-cols-[380px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="brand-kicker text-sm">CRM</p>
          <h2 className="brand-section-title text-xl">
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
          <div className="brand-card-warm p-3">
            <p className="brand-muted text-xs font-semibold">
              Proximo contato
            </p>
            <p className="brand-section-title text-sm">
              {summary.nextContactAt
                ? summary.nextContactAt.toLocaleDateString()
                : "Sem agenda"}
            </p>
          </div>
        </div>

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Cliente
          <select
            className="brand-input px-3 py-2"
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
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Tipo
            <select
              className="brand-input px-3 py-2"
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

          <label className="brand-muted grid gap-1 text-sm font-medium">
            Data
            <input
              className="brand-input px-3 py-2"
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

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Assunto
          <input
            className="brand-input px-3 py-2"
            value={form.subject}
            onChange={(event) =>
              setForm((state) => ({ ...state, subject: event.target.value }))
            }
          />
        </label>

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Proximo contato
          <input
            className="brand-input px-3 py-2"
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

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Observacoes
          <textarea
            className="brand-input min-h-20 px-3 py-2"
            value={form.notes}
            onChange={(event) =>
              setForm((state) => ({ ...state, notes: event.target.value }))
            }
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="brand-muted text-sm font-semibold">
            Feedbacks: {summary.interactionsByType.feedback}
          </p>
          <button
            className="brand-primary-button px-4 py-2 text-sm"
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
                  ? "border-[var(--brand-leaf)] bg-[#f4f9ec] text-[var(--brand-leaf)]"
                  : "border-[var(--brand-line)] text-[var(--brand-caramel)]"
              }`}
              key={status}
              onClick={() => setSelectedStatus(status)}
              type="button"
            >
              {getStatusFilterLabel(status)}
            </button>
          ))}
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Interacao</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredInteractions.map((interaction) => (
                <tr className="border-t border-[#f1dfb5]" key={interaction.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {customerNames.get(interaction.customerId) ?? "Cliente"}
                    </p>
                    <p className="brand-muted text-xs">
                      {interaction.occurredAt.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    <p className="font-semibold">{interaction.subject}</p>
                    <p className="brand-muted text-xs">
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
                          className="text-sm font-semibold text-[var(--brand-leaf)]"
                          onClick={async () => {
                            await completeInteraction.mutateAsync(
                              interaction.id,
                            );
                            recordAudit({
                              action: "customer_interaction.complete",
                              description: `Interacao ${interaction.subject} concluida`,
                              entity: "customer_interaction",
                              entityId: interaction.id,
                              metadata: { customerId: interaction.customerId },
                            });
                          }}
                        >
                          Concluir
                        </button>
                        <button
                          className="brand-muted text-sm font-semibold"
                          onClick={async () => {
                            await cancelInteraction.mutateAsync(interaction.id);
                            recordAudit({
                              action: "customer_interaction.cancel",
                              description: `Interacao ${interaction.subject} cancelada`,
                              entity: "customer_interaction",
                              entityId: interaction.id,
                              metadata: { customerId: interaction.customerId },
                            });
                          }}
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
    <div className="brand-card-warm p-3">
      <p className="brand-muted text-xs font-semibold">{label}</p>
      <p className="brand-section-title text-lg">{value}</p>
    </div>
  );
}

function Status({ status }: { status: CustomerInteractionStatus }) {
  const label =
    status === "open" ? "Aberta" : status === "done" ? "Concluida" : "Cancelada";
  const tone =
    status === "done"
      ? "bg-[#f4f9ec] text-[var(--brand-leaf)]"
      : status === "cancelled"
        ? "bg-[#f3ead7] text-[var(--brand-caramel)]"
        : "bg-[#fff4cf] text-[var(--brand-caramel)]";

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
