import { CreateRecipeInput, Recipe, RecipeRepository } from "@paobom/domain";

import { RecipeDTO } from "@/features/production/data/dto/ProductionDTO";
import { ProductionMapper } from "@/features/production/data/mappers/ProductionMapper";

const now = new Date().toISOString();

let recipes: RecipeDTO[] = [
  {
    active: true,
    created_at: now,
    id: "rec-1",
    ingredients: [
      {
        product_id: "prod-1",
        quantity: 0.05,
      },
    ],
    name: "Pao frances padrao",
    output_product_id: "prod-2",
    updated_at: now,
    yield_quantity: 1,
  },
];

export class MockRecipeRepository implements RecipeRepository {
  async create(input: CreateRecipeInput) {
    const recipe = new Recipe({
      ...input,
      active: true,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      updatedAt: new Date(),
    });

    recipes = [ProductionMapper.recipeToDTO(recipe), ...recipes];

    return recipe;
  }

  async findAll() {
    return recipes.map(ProductionMapper.recipeToEntity);
  }

  async findById(id: string) {
    const recipe = recipes.find((item) => item.id === id);

    return recipe ? ProductionMapper.recipeToEntity(recipe) : null;
  }
}
