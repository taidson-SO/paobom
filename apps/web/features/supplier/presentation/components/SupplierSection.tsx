"use client";

import { CreateSupplierInput } from "@paobom/domain";
import { FormEvent, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useSuppliers } from "@/features/supplier/presentation/hooks/useSuppliers";
import { SupplierSchema } from "@/features/supplier/schemas/SupplierSchema";

const initialForm: CreateSupplierInput = {
  contactName: "",
  document: "",
  email: "",
  name: "",
  phone: "",
};

export function SupplierSection() {
  const {
    createSupplier,
    deactivateSupplier,
    selectedSupplierId,
    setSelectedSupplier,
    suppliers,
    updateSupplier,
  } = useSuppliers();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canManageSuppliers = can("supplier:manage");
  const [form, setForm] = useState<CreateSupplierInput>(initialForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageSuppliers) {
      setError("Seu perfil nao pode alterar fornecedores.");
      return;
    }

    setError(null);

    try {
      const input = SupplierSchema.parse(form);

      if (selectedSupplierId) {
        const supplier = await updateSupplier.mutateAsync({
          id: selectedSupplierId,
          input,
        });

        recordAudit({
          action: "supplier.update",
          description: `Fornecedor ${supplier.name} atualizado`,
          entity: "supplier",
          entityId: supplier.id,
          metadata: { document: supplier.document },
        });
      } else {
        const supplier = await createSupplier.mutateAsync(input);

        recordAudit({
          action: "supplier.create",
          description: `Fornecedor ${supplier.name} criado`,
          entity: "supplier",
          entityId: supplier.id,
          metadata: { document: supplier.document },
        });
      }

      setSelectedSupplier(null);
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Fornecedor invalido");
    }
  }

  return (
    <section className="brand-card grid gap-4 p-4 lg:grid-cols-[360px_1fr]">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="brand-kicker text-sm">Fornecedores</p>
          <h2 className="brand-section-title text-xl">
            Relacionamento com fornecedores
          </h2>
        </div>
        {!canManageSuppliers ? (
          <PermissionNotice description="Voce pode consultar fornecedores, mas nao criar, editar ou inativar." />
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
          label="Contato"
          value={form.contactName}
          onChange={(contactName) =>
            setForm((state) => ({ ...state, contactName }))
          }
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

        <div className="flex gap-2">
          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canManageSuppliers}
          >
            {selectedSupplierId ? "Salvar" : "Criar"}
          </button>
          {selectedSupplierId ? (
            <button
              className="brand-secondary-button px-4 py-2 text-sm"
              type="button"
              onClick={() => setSelectedSupplier(null)}
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
              <th className="px-3 py-2">Fornecedor</th>
              <th className="px-3 py-2">Contato</th>
              <th className="px-3 py-2">Status</th>
              {canManageSuppliers ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr className="border-t border-[#f1dfb5]" key={supplier.id}>
                <td className="px-3 py-3">
                  <p className="brand-section-title font-semibold">
                    {supplier.name}
                  </p>
                  <p className="brand-muted text-xs">{supplier.document}</p>
                </td>
                <td className="px-3 py-3 text-[var(--brand-brown)]">
                  <p>{supplier.contactName}</p>
                  <p className="brand-muted text-xs">{supplier.phone}</p>
                </td>
                <td className="px-3 py-3">
                  <Status active={supplier.active} />
                </td>
                {canManageSuppliers ? (
                  <td className="px-3 py-3 text-right">
                    <RowActions
                      active={supplier.active}
                      onDeactivate={async () => {
                        await deactivateSupplier.mutateAsync(supplier.id);
                        recordAudit({
                          action: "supplier.deactivate",
                          description: `Fornecedor ${supplier.name} inativado`,
                          entity: "supplier",
                          entityId: supplier.id,
                          metadata: { document: supplier.document },
                        });
                      }}
                      onEdit={() => {
                        setSelectedSupplier(supplier.id);
                        setForm({
                          contactName: supplier.contactName,
                          document: supplier.document,
                          email: supplier.email,
                          name: supplier.name,
                          phone: supplier.phone,
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
