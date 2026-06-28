"use client";

import { FormEvent, useState } from "react";

import { CreateProductInput, ProductKind, ProductUnit } from "@paobom/domain";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useProducts } from "@/features/product/presentation/hooks/useProducts";
import { ProductSchema } from "@/features/product/schemas/ProductSchema";

const initialForm: CreateProductInput = {
  category: "",
  kind: "raw_material",
  minimumStock: 0,
  name: "",
  purchasePrice: 0,
  salePrice: 0,
  sku: "",
  unit: "unit",
};

export function ProductSection() {
  const {
    createProduct,
    deactivateProduct,
    products,
    selectedProductId,
    setSelectedProduct,
    updateProduct,
  } = useProducts();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canManageProducts = can("product:manage");
  const [form, setForm] = useState<CreateProductInput>(initialForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageProducts) {
      setError("Seu perfil nao pode alterar produtos.");
      return;
    }

    setError(null);

    try {
      const input = ProductSchema.parse(form);

      if (selectedProductId) {
        const product = await updateProduct.mutateAsync({
          id: selectedProductId,
          input,
        });

        recordAudit({
          action: "product.update",
          description: `Produto ${product.name} atualizado`,
          entity: "product",
          entityId: product.id,
          metadata: { sku: product.sku },
        });
      } else {
        const product = await createProduct.mutateAsync(input);

        recordAudit({
          action: "product.create",
          description: `Produto ${product.name} criado`,
          entity: "product",
          entityId: product.id,
          metadata: { kind: product.kind, sku: product.sku },
        });
      }

      setSelectedProduct(null);
      setForm(initialForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Produto invalido");
    }
  }

  return (
    <section className="brand-card grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-3" onSubmit={handleSubmit}>
        <div>
          <p className="brand-kicker text-sm">Produtos</p>
          <h2 className="brand-section-title text-xl">
            Cadastro de produtos
          </h2>
        </div>
        {!canManageProducts ? (
          <PermissionNotice description="Voce pode consultar produtos, mas nao criar, editar ou inativar." />
        ) : null}

        <Field
          label="Nome"
          value={form.name}
          onChange={(name) => setForm((state) => ({ ...state, name }))}
        />
        <Field
          label="SKU"
          value={form.sku}
          onChange={(sku) => setForm((state) => ({ ...state, sku }))}
        />
        <Field
          label="Categoria"
          value={form.category}
          onChange={(category) => setForm((state) => ({ ...state, category }))}
        />
        <label className="brand-muted grid min-w-0 gap-1 text-sm font-medium">
          Tipo
          <select
            className="brand-input px-3 py-2"
            value={form.kind}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                kind: event.target.value as ProductKind,
              }))
            }
          >
            <option value="raw_material">Insumo</option>
            <option value="finished_product">Produto fabricado</option>
            <option value="resale">Revenda</option>
            <option value="packaging">Embalagem</option>
          </select>
        </label>
        <label className="brand-muted grid min-w-0 gap-1 text-sm font-medium">
          Unidade
          <select
            className="brand-input px-3 py-2"
            value={form.unit}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                unit: event.target.value as ProductUnit,
              }))
            }
          >
            <option value="unit">Unidade</option>
            <option value="kg">Kg</option>
            <option value="g">Grama</option>
            <option value="ml">Mililitro</option>
            <option value="liter">Litro</option>
            <option value="package">Pacote</option>
          </select>
        </label>
        <div className="grid min-w-0 gap-2 sm:grid-cols-3">
          <NumberField
            label="Compra"
            value={form.purchasePrice}
            onChange={(purchasePrice) =>
              setForm((state) => ({ ...state, purchasePrice }))
            }
          />
          <NumberField
            label="Venda"
            value={form.salePrice}
            onChange={(salePrice) =>
              setForm((state) => ({ ...state, salePrice }))
            }
          />
          <NumberField
            label="Min."
            value={form.minimumStock}
            onChange={(minimumStock) =>
              setForm((state) => ({ ...state, minimumStock }))
            }
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canManageProducts}
          >
            {selectedProductId ? "Salvar" : "Criar"}
          </button>
          {selectedProductId ? (
            <button
              className="brand-secondary-button px-4 py-2 text-sm"
              type="button"
              onClick={() => setSelectedProduct(null)}
            >
              Limpar
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm font-semibold text-red-700">{error}</p>
        ) : null}
      </form>

      <div className="brand-table min-w-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="brand-table-header text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Produto</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Preco</th>
              <th className="px-3 py-2">Status</th>
              {canManageProducts ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-t border-[#f1dfb5]" key={product.id}>
                <td className="px-3 py-3">
                  <p className="brand-section-title font-semibold">
                    {product.name}
                  </p>
                  <p className="brand-muted text-xs">
                    {product.sku} · {product.category} ·{" "}
                    {getUnitLabel(product.unit)}
                  </p>
                </td>
                <td className="px-3 py-3 text-[var(--brand-brown)]">
                  {getKindLabel(product.kind)}
                </td>
                <td className="px-3 py-3 text-[var(--brand-brown)]">
                  R$ {product.salePrice.toFixed(2)}
                </td>
                <td className="px-3 py-3">
                  <Status active={product.active} />
                </td>
                {canManageProducts ? (
                  <td className="px-3 py-3 text-right">
                    <RowActions
                      active={product.active}
                      onDeactivate={async () => {
                        await deactivateProduct.mutateAsync(product.id);
                        recordAudit({
                          action: "product.deactivate",
                          description: `Produto ${product.name} inativado`,
                          entity: "product",
                          entityId: product.id,
                          metadata: { sku: product.sku },
                        });
                      }}
                      onEdit={() => {
                        setSelectedProduct(product.id);
                        setForm({
                          category: product.category,
                          kind: product.kind,
                          minimumStock: product.minimumStock,
                          name: product.name,
                          purchasePrice: product.purchasePrice,
                          salePrice: product.salePrice,
                          sku: product.sku,
                          unit: product.unit,
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

function getKindLabel(kind: ProductKind) {
  const labels: Record<ProductKind, string> = {
    finished_product: "Fabricado",
    packaging: "Embalagem",
    raw_material: "Insumo",
    resale: "Revenda",
  };

  return labels[kind];
}

function getUnitLabel(unit: ProductUnit) {
  const labels: Record<ProductUnit, string> = {
    g: "g",
    kg: "kg",
    liter: "L",
    ml: "ml",
    package: "pct.",
    unit: "un.",
  };

  return labels[unit];
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
    <label className="brand-muted grid min-w-0 gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="brand-muted grid min-w-0 gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        min="0"
        step="0.01"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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
    <div className="flex flex-wrap justify-end gap-2">
      <button
        className="text-sm font-semibold text-[var(--brand-leaf)]"
        onClick={onEdit}
      >
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
