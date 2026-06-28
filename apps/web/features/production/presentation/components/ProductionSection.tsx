"use client";

import { Product } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useProduction } from "@/features/production/presentation/hooks/useProduction";
import {
  ProductionOrderSchema,
  RecipeSchema,
} from "@/features/production/schemas/ProductionSchema";

type RecipeFormIngredient = {
  productId: string;
  quantity: number;
};

type RecipeForm = {
  ingredients: RecipeFormIngredient[];
  name: string;
  outputProductId: string;
  yieldQuantity: number;
};

type OrderForm = {
  notes: string;
  quantityProduced: number;
  recipeId: string;
};

const initialRecipeForm: RecipeForm = {
  ingredients: [{ productId: "", quantity: 1 }],
  name: "",
  outputProductId: "",
  yieldQuantity: 1,
};

const initialOrderForm: OrderForm = {
  notes: "",
  quantityProduced: 1,
  recipeId: "",
};

export function ProductionSection({ products }: { products: Product[] }) {
  const {
    cancelProductionOrder,
    createProductionOrder,
    createRecipe,
    finishProductionOrder,
    orders,
    recipes,
    selectedRecipeId,
    setSelectedRecipe,
    startProductionOrder,
  } = useProduction();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canManageRecipe = can("production:manage-recipe");
  const canManageOrder = can("production:manage-order");
  const canCancelProduction = can("production:cancel");
  const [recipeForm, setRecipeForm] = useState<RecipeForm>(initialRecipeForm);
  const [orderForm, setOrderForm] = useState<OrderForm>(initialOrderForm);
  const [error, setError] = useState<string | null>(null);
  const ingredientProducts = products.filter((product) =>
    product.canBeRecipeIngredient(),
  );
  const outputProducts = products.filter((product) => product.canBeProduced());
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId);

  async function handleCreateRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageRecipe) {
      setError("Seu perfil nao pode criar fichas tecnicas.");
      return;
    }

    setError(null);

    try {
      const input = RecipeSchema.parse(recipeForm);

      const recipe = await createRecipe.mutateAsync(input);
      recordAudit({
        action: "recipe.create-version",
        description: `Ficha tecnica ${recipe.name} v${recipe.version} criada`,
        entity: "recipe",
        entityId: recipe.id,
        metadata: {
          ingredients: recipe.ingredients.length,
          outputProductId: recipe.outputProductId,
          version: recipe.version,
        },
      });
      setRecipeForm(initialRecipeForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ficha tecnica invalida");
    }
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageOrder) {
      setError("Seu perfil nao pode planejar producao.");
      return;
    }

    setError(null);

    try {
      const input = ProductionOrderSchema.parse(orderForm);

      const order = await createProductionOrder.mutateAsync(input);
      recordAudit({
        action: "production_order.create",
        description: `Ordem de producao ${order.id} planejada`,
        entity: "production_order",
        entityId: order.id,
        metadata: {
          quantityProduced: order.quantityProduced,
          recipeId: order.recipeId,
        },
      });
      setOrderForm(initialOrderForm);
      setSelectedRecipe(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Producao invalida");
    }
  }

  function updateIngredient(index: number, next: Partial<RecipeFormIngredient>) {
    setRecipeForm((state) => ({
      ...state,
      ingredients: state.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...next } : ingredient,
      ),
    }));
  }

  return (
    <section className="brand-card grid gap-4 p-4 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <div>
          <p className="brand-kicker text-sm">Producao</p>
          <h2 className="brand-section-title text-xl">
            Fichas tecnicas e ordens
          </h2>
        </div>

        <form className="brand-card-warm space-y-3 p-3" onSubmit={handleCreateRecipe}>
          <h3 className="brand-section-title text-sm">
            Nova versao de ficha tecnica
          </h3>
          {!canManageRecipe ? (
            <PermissionNotice description="Voce pode consultar fichas, mas nao criar novas versoes." />
          ) : null}
          <Field
            label="Nome"
            value={recipeForm.name}
            onChange={(name) =>
              setRecipeForm((state) => ({ ...state, name }))
            }
          />
          <ProductSelect
            label="Produto produzido"
            products={outputProducts}
            value={recipeForm.outputProductId}
            onChange={(outputProductId) =>
              setRecipeForm((state) => ({ ...state, outputProductId }))
            }
          />
          <NumberField
            label="Rendimento"
            value={recipeForm.yieldQuantity}
            onChange={(yieldQuantity) =>
              setRecipeForm((state) => ({ ...state, yieldQuantity }))
            }
          />

          <div className="space-y-2">
            {recipeForm.ingredients.map((ingredient, index) => (
              <div className="brand-card-warm grid gap-2 p-2" key={index}>
                <ProductSelect
                  label="Insumo"
                  products={ingredientProducts}
                  value={ingredient.productId}
                  onChange={(productId) => updateIngredient(index, { productId })}
                />
                <NumberField
                  label="Quantidade"
                  value={ingredient.quantity}
                  onChange={(quantity) => updateIngredient(index, { quantity })}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="brand-secondary-button px-4 py-2 text-sm"
              type="button"
              onClick={() =>
                setRecipeForm((state) => ({
                  ...state,
                  ingredients: [
                    ...state.ingredients,
                    { productId: "", quantity: 1 },
                  ],
                }))
              }
            >
              Adicionar insumo
            </button>
            <button
              className="brand-primary-button px-4 py-2 text-sm"
              disabled={!canManageRecipe}
            >
              Criar ficha
            </button>
          </div>
        </form>

        <form className="brand-card-warm space-y-3 p-3" onSubmit={handleCreateOrder}>
          <h3 className="brand-section-title text-sm">Nova ordem</h3>
          {!canManageOrder ? (
            <PermissionNotice description="Voce pode acompanhar ordens, mas nao planejar ou executar producao." />
          ) : null}
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Ficha tecnica
            <select
              className="brand-input px-3 py-2"
              value={orderForm.recipeId}
              onChange={(event) => {
                setOrderForm((state) => ({
                  ...state,
                  recipeId: event.target.value,
                }));
                setSelectedRecipe(event.target.value || null);
              }}
            >
              <option value="">Selecione</option>
              {recipes
                .filter((recipe) => recipe.active)
                .map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
            </select>
          </label>
          <NumberField
            label="Quantidade produzida"
            value={orderForm.quantityProduced}
            onChange={(quantityProduced) =>
              setOrderForm((state) => ({ ...state, quantityProduced }))
            }
          />
          <Field
            label="Observacoes"
            value={orderForm.notes}
            onChange={(notes) =>
              setOrderForm((state) => ({ ...state, notes }))
            }
          />
          {selectedRecipe ? (
            <p className="brand-card-warm brand-muted p-2 text-xs">
              Produz {productNames.get(selectedRecipe.outputProductId)} com{" "}
              {selectedRecipe.ingredients.length} insumo(s).
            </p>
          ) : null}
          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canManageOrder}
          >
            Planejar producao
          </button>
        </form>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      <div className="grid gap-4">
        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Ficha</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Insumos</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr className="border-t border-[#f1dfb5]" key={recipe.id}>
                  <td className="brand-section-title px-3 py-3 font-semibold">
                    <p>{recipe.name}</p>
                    <p className="brand-muted text-xs font-normal">
                      v{recipe.version} · {recipe.active ? "ativa" : "historica"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {productNames.get(recipe.outputProductId)}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {recipe.ingredients.map((ingredient) => (
                      <p key={ingredient.productId}>
                        {productNames.get(ingredient.productId)} ·{" "}
                        {ingredient.quantity}
                      </p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Ordem</th>
                <th className="px-3 py-2">Produzido</th>
                <th className="px-3 py-2">Custo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className="border-t border-[#f1dfb5]" key={order.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {recipes.find((recipe) => recipe.id === order.recipeId)
                        ?.name ?? order.recipeSnapshot.recipeName}
                    </p>
                    <p className="brand-muted text-xs">
                      v{order.recipeSnapshot.recipeVersion} ·{" "}
                      {order.startedAt?.toLocaleDateString() ?? "nao iniciada"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {order.quantityProduced} ·{" "}
                    {productNames.get(order.outputProductId)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                    R$ {order.totalCost.toFixed(2)}
                    <p className="brand-muted text-xs font-medium">
                      Unit. R$ {order.unitCost.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Status status={order.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === "planned" ? (
                        <>
                          {canManageOrder ? (
                            <button
                              className="text-sm font-semibold text-[var(--brand-leaf)]"
                              onClick={async () => {
                                await startProductionOrder.mutateAsync(order.id);
                                recordAudit({
                                  action: "production_order.start",
                                  description: `Ordem ${order.id} iniciada`,
                                  entity: "production_order",
                                  entityId: order.id,
                                  metadata: { recipeId: order.recipeId },
                                });
                              }}
                            >
                              Iniciar
                            </button>
                          ) : null}
                          {canCancelProduction ? (
                            <button
                              className="brand-muted text-sm font-semibold"
                              onClick={async () => {
                                await cancelProductionOrder.mutateAsync(order.id);
                                recordAudit({
                                  action: "production_order.cancel",
                                  description: `Ordem ${order.id} cancelada`,
                                  entity: "production_order",
                                  entityId: order.id,
                                  metadata: { status: order.status },
                                });
                              }}
                            >
                              Cancelar
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      {order.status === "started" ? (
                        <>
                          {canManageOrder ? (
                            <button
                              className="text-sm font-semibold text-[var(--brand-leaf)]"
                              onClick={async () => {
                                await finishProductionOrder.mutateAsync(order.id);
                                recordAudit({
                                  action: "production_order.finish",
                                  description: `Ordem ${order.id} finalizada`,
                                  entity: "production_order",
                                  entityId: order.id,
                                  metadata: {
                                    totalCost: order.totalCost,
                                    unitCost: order.unitCost,
                                  },
                                });
                              }}
                            >
                              Finalizar
                            </button>
                          ) : null}
                          {canCancelProduction ? (
                            <button
                              className="brand-muted text-sm font-semibold"
                              onClick={async () => {
                                await cancelProductionOrder.mutateAsync(order.id);
                                recordAudit({
                                  action: "production_order.cancel",
                                  description: `Ordem ${order.id} cancelada`,
                                  entity: "production_order",
                                  entityId: order.id,
                                  metadata: { status: order.status },
                                });
                              }}
                            >
                              Cancelar
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
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

function Status({
  status,
}: {
  status: "planned" | "started" | "finished" | "cancelled";
}) {
  const labels = {
    cancelled: "Cancelada",
    finished: "Finalizada",
    planned: "A produzir",
    started: "Iniciada",
  };
  const colors = {
    cancelled: "bg-[#f3ead7] text-[var(--brand-caramel)]",
    finished: "bg-[#f4f9ec] text-[var(--brand-leaf)]",
    planned: "bg-[#fff4cf] text-[var(--brand-caramel)]",
    started: "bg-blue-100 text-blue-800",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${colors[status]}`}>
      {labels[status]}
    </span>
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
    <label className="brand-muted grid gap-1 text-sm font-medium">
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

function ProductSelect({
  label,
  onChange,
  products,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  products: Product[];
  value: string;
}) {
  return (
    <label className="brand-muted grid gap-1 text-sm font-medium">
      {label}
      <select
        className="brand-input px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecione</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </label>
  );
}
