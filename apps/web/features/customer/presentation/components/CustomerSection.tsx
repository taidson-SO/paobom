"use client";

import { CreateCustomerInput } from "@paobom/domain";
import { FormEvent, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useCustomers } from "@/features/customer/presentation/hooks/useCustomers";
import { CustomerSchema } from "@/features/customer/schemas/CustomerSchema";

const initialForm: CreateCustomerInput = {
  document: "",
  email: "",
  name: "",
  notes: "",
  phone: "",
};

export function CustomerSection() {
  const {
    createCustomer,
    customers,
    deactivateCustomer,
    selectedCustomerId,
    setSelectedCustomer,
    updateCustomer,
  } = useCustomers();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canManageCustomers = can("customer:manage");
  const [form, setForm] = useState<CreateCustomerInput>(initialForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageCustomers) {
      setError("Seu perfil nao pode alterar clientes.");
      return;
    }

    setError(null);

    try {
      const input = CustomerSchema.parse(form);

      if (selectedCustomerId) {
        const customer = await updateCustomer.mutateAsync({
          id: selectedCustomerId,
          input,
        });

        recordAudit({
          action: "customer.update",
          description: `Cliente ${customer.name} atualizado`,
          entity: "customer",
          entityId: customer.id,
          metadata: { document: customer.document },
        });
      } else {
        const customer = await createCustomer.mutateAsync(input);

        recordAudit({
          action: "customer.create",
          description: `Cliente ${customer.name} criado`,
          entity: "customer",
          entityId: customer.id,
          metadata: { document: customer.document },
        });
      }

      setSelectedCustomer(null);
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cliente invalido");
    }
  }

  return (
    <section className="brand-card grid gap-4 p-4 lg:grid-cols-[360px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="brand-kicker text-sm">Clientes</p>
          <h2 className="brand-section-title text-xl">
            Relacionamento com clientes
          </h2>
        </div>
        {!canManageCustomers ? (
          <PermissionNotice description="Voce pode consultar clientes, mas nao criar, editar ou inativar." />
        ) : null}

        <Field
          label="Nome"
          value={form.name}
          onChange={(name) => setForm((state) => ({ ...state, name }))}
        />
        <Field
          label="Documento"
          value={form.document}
          onChange={(document) => setForm((state) => ({ ...state, document }))}
        />
        <Field
          label="Telefone"
          value={form.phone}
          onChange={(phone) => setForm((state) => ({ ...state, phone }))}
        />
        <Field
          label="Email"
          value={form.email}
          onChange={(email) => setForm((state) => ({ ...state, email }))}
        />
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

        <div className="flex gap-2">
          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canManageCustomers}
          >
            {selectedCustomerId ? "Salvar" : "Criar"}
          </button>
          {selectedCustomerId ? (
            <button
              className="brand-secondary-button px-4 py-2 text-sm"
              type="button"
              onClick={() => setSelectedCustomer(null)}
            >
              Limpar
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      <div className="brand-table">
        <table className="w-full text-left text-sm">
          <thead className="brand-table-header text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Contato</th>
              <th className="px-3 py-2">Status</th>
              {canManageCustomers ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr className="border-t border-[#f1dfb5]" key={customer.id}>
                <td className="px-3 py-3">
                  <p className="brand-section-title font-semibold">
                    {customer.name}
                  </p>
                  <p className="brand-muted text-xs">{customer.document}</p>
                </td>
                <td className="px-3 py-3 text-[var(--brand-brown)]">
                  <p>{customer.phone}</p>
                  <p className="brand-muted text-xs">{customer.email}</p>
                </td>
                <td className="px-3 py-3">
                  <Status active={customer.active} />
                </td>
                {canManageCustomers ? (
                  <td className="px-3 py-3 text-right">
                    <RowActions
                      active={customer.active}
                      onDeactivate={async () => {
                        await deactivateCustomer.mutateAsync(customer.id);
                        recordAudit({
                          action: "customer.deactivate",
                          description: `Cliente ${customer.name} inativado`,
                          entity: "customer",
                          entityId: customer.id,
                          metadata: { document: customer.document },
                        });
                      }}
                      onEdit={() => {
                        setSelectedCustomer(customer.id);
                        setForm({
                          document: customer.document,
                          email: customer.email,
                          name: customer.name,
                          notes: customer.notes,
                          phone: customer.phone,
                        });
                      }}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="brand-muted grid gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-bold ${
        active
          ? "bg-[#f4f9ec] text-[var(--brand-leaf)]"
          : "bg-[#f3ead7] text-[var(--brand-caramel)]"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function RowActions({
  active,
  onDeactivate,
  onEdit,
}: {
  active: boolean;
  onDeactivate: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button className="text-sm font-semibold text-[var(--brand-leaf)]" onClick={onEdit}>
        Editar
      </button>
      {active ? (
        <button
          className="brand-muted text-sm font-semibold"
          onClick={onDeactivate}
        >
          Inativar
        </button>
      ) : null}
    </div>
  );
}
