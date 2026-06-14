"use client";

import { Product } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

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
    setError(null);

    try {
      const input = RecipeSchema.parse(recipeForm);

      await createRecipe.mutateAsync(input);
      setRecipeForm(initialRecipeForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ficha tecnica invalida");
    }
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const input = ProductionOrderSchema.parse(orderForm);

      await createProductionOrder.mutateAsync(input);
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
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold text-green-800">Producao</p>
          <h2 className="text-xl font-bold text-zinc-950">
            Fichas tecnicas e ordens
          </h2>
        </div>

        <form className="space-y-3 rounded-md border border-zinc-200 p-3" onSubmit={handleCreateRecipe}>
          <h3 className="text-sm font-bold text-zinc-800">
            Nova versao de ficha tecnica
          </h3>
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
              <div className="grid gap-2 rounded-md bg-zinc-50 p-2" key={index}>
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
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700"
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
            <button className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white">
              Criar ficha
            </button>
          </div>
        </form>

        <form className="space-y-3 rounded-md border border-zinc-200 p-3" onSubmit={handleCreateOrder}>
          <h3 className="text-sm font-bold text-zinc-800">Nova ordem</h3>
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Ficha tecnica
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
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
            <p className="rounded-md bg-zinc-50 p-2 text-xs text-zinc-600">
              Produz {productNames.get(selectedRecipe.outputProductId)} com{" "}
              {selectedRecipe.ingredients.length} insumo(s).
            </p>
          ) : null}
          <button className="rounded-md bg-green-800 px-4 py-2 text-sm font-bold text-white">
            Planejar producao
          </button>
        </form>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      <div className="grid gap-4">
        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Ficha</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Insumos</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr className="border-t border-zinc-100" key={recipe.id}>
                  <td className="px-3 py-3 font-semibold text-zinc-950">
                    <p>{recipe.name}</p>
                    <p className="text-xs font-normal text-zinc-500">
                      v{recipe.version} · {recipe.active ? "ativa" : "historica"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {productNames.get(recipe.outputProductId)}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
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

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
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
                <tr className="border-t border-zinc-100" key={order.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-950">
                      {recipes.find((recipe) => recipe.id === order.recipeId)
                        ?.name ?? order.recipeSnapshot.recipeName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      v{order.recipeSnapshot.recipeVersion} ·{" "}
                      {order.startedAt?.toLocaleDateString() ?? "nao iniciada"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {order.quantityProduced} ·{" "}
                    {productNames.get(order.outputProductId)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-zinc-800">
                    R$ {order.totalCost.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <Status status={order.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === "planned" ? (
                        <>
                          <button
                            className="text-sm font-semibold text-green-800"
                            onClick={() => startProductionOrder.mutate(order.id)}
                          >
                            Iniciar
                          </button>
                          <button
                            className="text-sm font-semibold text-zinc-500"
                            onClick={() => cancelProductionOrder.mutate(order.id)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : null}
                      {order.status === "started" ? (
                        <>
                          <button
                            className="text-sm font-semibold text-green-800"
                            onClick={() => finishProductionOrder.mutate(order.id)}
                          >
                            Finalizar
                          </button>
                          <button
                            className="text-sm font-semibold text-zinc-500"
                            onClick={() => cancelProductionOrder.mutate(order.id)}
                          >
                            Cancelar
                          </button>
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
    cancelled: "bg-zinc-100 text-zinc-500",
    finished: "bg-green-100 text-green-800",
    planned: "bg-amber-100 text-amber-800",
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
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        className="rounded-md border border-zinc-300 px-3 py-2"
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
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <select
        className="rounded-md border border-zinc-300 px-3 py-2"
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
