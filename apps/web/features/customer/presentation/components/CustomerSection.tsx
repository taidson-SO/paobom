"use client";

import { CreateCustomerInput } from "@paobom/domain";
import { FormEvent, useState } from "react";

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
  const [form, setForm] = useState<CreateCustomerInput>(initialForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const input = CustomerSchema.parse(form);

      if (selectedCustomerId) {
        await updateCustomer.mutateAsync({ id: selectedCustomerId, input });
      } else {
        await createCustomer.mutateAsync(input);
      }

      setSelectedCustomer(null);
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cliente invalido");
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 lg:grid-cols-[360px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-bold text-green-800">Clientes</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Relacionamento com clientes
          </h2>
        </div>

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

        <div className="flex gap-2">
          <button className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white">
            {selectedCustomerId ? "Salvar" : "Criar"}
          </button>
          {selectedCustomerId ? (
            <button
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700"
              type="button"
              onClick={() => setSelectedCustomer(null)}
            >
              Limpar
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      <div className="overflow-hidden rounded-md border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Contato</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr className="border-t border-zinc-100" key={customer.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold text-zinc-950">
                    {customer.name}
                  </p>
                  <p className="text-xs text-zinc-500">{customer.document}</p>
                </td>
                <td className="px-3 py-3 text-zinc-700">
                  <p>{customer.phone}</p>
                  <p className="text-xs text-zinc-500">{customer.email}</p>
                </td>
                <td className="px-3 py-3">
                  <Status active={customer.active} />
                </td>
                <td className="px-3 py-3 text-right">
                  <RowActions
                    active={customer.active}
                    onDeactivate={() => deactivateCustomer.mutate(customer.id)}
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
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        className="rounded-md border border-zinc-300 px-3 py-2"
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
        active ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-500"
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
      <button className="text-sm font-semibold text-green-800" onClick={onEdit}>
        Editar
      </button>
      {active ? (
        <button
          className="text-sm font-semibold text-zinc-500"
          onClick={onDeactivate}
        >
          Inativar
        </button>
      ) : null}
    </div>
  );
}
