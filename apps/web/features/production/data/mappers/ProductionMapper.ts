import {
  ProductionOrder,
  ProductionOrderProps,
  Recipe,
  RecipeProps,
} from "@paobom/domain";

import {
  ProductionOrderDTO,
  RecipeDTO,
} from "@/features/production/data/dto/ProductionDTO";

export class ProductionMapper {
  static recipeToDTO(entity: Recipe): RecipeDTO {
    const recipe = entity.toJSON();

    return {
      active: recipe.active,
      created_at: recipe.createdAt.toISOString(),
      id: recipe.id,
      ingredients: recipe.ingredients.map((ingredient) => ({
        product_id: ingredient.productId,
        quantity: ingredient.quantity,
      })),
      name: recipe.name,
      output_product_id: recipe.outputProductId,
      updated_at: recipe.updatedAt.toISOString(),
      version: recipe.version,
      yield_quantity: recipe.yieldQuantity,
    };
  }

  static recipeToEntity(dto: RecipeDTO) {
    const props: RecipeProps = {
      active: dto.active,
      createdAt: new Date(dto.created_at),
      id: dto.id,
      ingredients: dto.ingredients.map((ingredient) => ({
        productId: ingredient.product_id,
        quantity: ingredient.quantity,
      })),
      name: dto.name,
      outputProductId: dto.output_product_id,
      updatedAt: new Date(dto.updated_at),
      version: dto.version,
      yieldQuantity: dto.yield_quantity,
    };

    return new Recipe(props);
  }

  static orderToDTO(entity: ProductionOrder): ProductionOrderDTO {
    const order = entity.toJSON();

    return {
      completed_at: order.completedAt?.toISOString() ?? null,
      created_at: order.createdAt.toISOString(),
      id: order.id,
      ingredient_consumptions: order.ingredientConsumptions.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
      })),
      notes: order.notes,
      output_product_id: order.outputProductId,
      quantity_produced: order.quantityProduced,
      recipe_id: order.recipeId,
      recipe_snapshot: {
        ingredients: order.recipeSnapshot.ingredients.map((ingredient) => ({
          product_id: ingredient.productId,
          quantity: ingredient.quantity,
        })),
        output_product_id: order.recipeSnapshot.outputProductId,
        recipe_id: order.recipeSnapshot.recipeId,
        recipe_name: order.recipeSnapshot.recipeName,
        recipe_version: order.recipeSnapshot.recipeVersion,
        yield_quantity: order.recipeSnapshot.yieldQuantity,
      },
      status: order.status,
    };
  }

  static orderToEntity(dto: ProductionOrderDTO) {
    const props: ProductionOrderProps = {
      completedAt: dto.completed_at ? new Date(dto.completed_at) : null,
      createdAt: new Date(dto.created_at),
      id: dto.id,
      ingredientConsumptions: dto.ingredient_consumptions.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        unitCost: item.unit_cost,
      })),
      notes: dto.notes,
      outputProductId: dto.output_product_id,
      quantityProduced: dto.quantity_produced,
      recipeId: dto.recipe_id,
      recipeSnapshot: {
        ingredients: dto.recipe_snapshot.ingredients.map((ingredient) => ({
          productId: ingredient.product_id,
          quantity: ingredient.quantity,
        })),
        outputProductId: dto.recipe_snapshot.output_product_id,
        recipeId: dto.recipe_snapshot.recipe_id,
        recipeName: dto.recipe_snapshot.recipe_name,
        recipeVersion: dto.recipe_snapshot.recipe_version,
        yieldQuantity: dto.recipe_snapshot.yield_quantity,
      },
      status: dto.status,
    };

    return new ProductionOrder(props);
  }
}
