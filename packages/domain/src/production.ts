import { ProductRepository } from "./product";

export type RecipeIngredientProps = {
  productId: string;
  quantity: number;
};

export type RecipeProps = {
  id: string;
  name: string;
  outputProductId: string;
  yieldQuantity: number;
  ingredients: RecipeIngredientProps[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRecipeInput = {
  name: string;
  outputProductId: string;
  yieldQuantity: number;
  ingredients: RecipeIngredientProps[];
};

export type ProductionOrderStatus = "planned" | "completed" | "cancelled";

export type ProductionConsumptionProps = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export type ProductionOrderProps = {
  id: string;
  recipeId: string;
  outputProductId: string;
  quantityProduced: number;
  status: ProductionOrderStatus;
  ingredientConsumptions: ProductionConsumptionProps[];
  notes: string;
  createdAt: Date;
  completedAt: Date | null;
};

export type CreateProductionOrderInput = {
  recipeId: string;
  quantityProduced: number;
  notes: string;
};

export class Recipe {
  constructor(private readonly props: RecipeProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get outputProductId() {
    return this.props.outputProductId;
  }

  get yieldQuantity() {
    return this.props.yieldQuantity;
  }

  get ingredients() {
    return [...this.props.ingredients];
  }

  get active() {
    return this.props.active;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  scaleIngredients(quantityProduced: number) {
    const factor = quantityProduced / this.props.yieldQuantity;

    return this.props.ingredients.map((ingredient) => ({
      productId: ingredient.productId,
      quantity: ingredient.quantity * factor,
    }));
  }

  toJSON(): RecipeProps {
    return {
      ...this.props,
      ingredients: this.ingredients,
    };
  }

  private assertValid() {
    if (this.props.name.trim().length < 2) {
      throw new Error("Nome da ficha tecnica deve ter pelo menos 2 caracteres");
    }

    if (!this.props.outputProductId) {
      throw new Error("Produto produzido deve ser informado");
    }

    if (this.props.yieldQuantity <= 0) {
      throw new Error("Rendimento deve ser maior que zero");
    }

    if (this.props.ingredients.length === 0) {
      throw new Error("Ficha tecnica deve possuir pelo menos um insumo");
    }

    this.props.ingredients.forEach((ingredient) => {
      if (!ingredient.productId) {
        throw new Error("Produto do insumo deve ser informado");
      }

      if (ingredient.quantity <= 0) {
        throw new Error("Quantidade do insumo deve ser maior que zero");
      }
    });
  }
}

export class ProductionOrder {
  constructor(private readonly props: ProductionOrderProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get recipeId() {
    return this.props.recipeId;
  }

  get outputProductId() {
    return this.props.outputProductId;
  }

  get quantityProduced() {
    return this.props.quantityProduced;
  }

  get status() {
    return this.props.status;
  }

  get ingredientConsumptions() {
    return [...this.props.ingredientConsumptions];
  }

  get notes() {
    return this.props.notes;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get completedAt() {
    return this.props.completedAt;
  }

  get totalCost() {
    return this.props.ingredientConsumptions.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );
  }

  toJSON(): ProductionOrderProps {
    return {
      ...this.props,
      ingredientConsumptions: this.ingredientConsumptions,
    };
  }

  private assertValid() {
    if (!this.props.recipeId) {
      throw new Error("Ficha tecnica deve ser informada");
    }

    if (!this.props.outputProductId) {
      throw new Error("Produto produzido deve ser informado");
    }

    if (this.props.quantityProduced <= 0) {
      throw new Error("Quantidade produzida deve ser maior que zero");
    }
  }
}

export interface RecipeRepository {
  create(input: CreateRecipeInput): Promise<Recipe>;
  findAll(): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
}

export interface ProductionOrderRepository {
  create(order: ProductionOrder): Promise<ProductionOrder>;
  findAll(): Promise<ProductionOrder[]>;
}

export interface ProductionInventoryGateway {
  registerProduction(order: ProductionOrder): Promise<void>;
}

export class ListRecipesUseCase {
  constructor(private readonly repository: RecipeRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreateRecipeUseCase {
  constructor(
    private readonly repository: RecipeRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateRecipeInput) {
    const outputProduct = await this.products.findById(input.outputProductId);

    if (!outputProduct || !outputProduct.active) {
      throw new Error("Produto produzido deve estar ativo");
    }

    for (const ingredient of input.ingredients) {
      const product = await this.products.findById(ingredient.productId);

      if (!product || !product.active) {
        throw new Error("Todos os insumos devem usar produtos ativos");
      }
    }

    return this.repository.create(input);
  }
}

export class ListProductionOrdersUseCase {
  constructor(private readonly repository: ProductionOrderRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreateProductionOrderUseCase {
  constructor(
    private readonly orders: ProductionOrderRepository,
    private readonly recipes: RecipeRepository,
    private readonly products: ProductRepository,
    private readonly inventory: ProductionInventoryGateway,
  ) {}

  async execute(input: CreateProductionOrderInput) {
    const recipe = await this.recipes.findById(input.recipeId);

    if (!recipe || !recipe.active) {
      throw new Error("Ficha tecnica ativa deve ser informada");
    }

    const outputProduct = await this.products.findById(recipe.outputProductId);

    if (!outputProduct || !outputProduct.active) {
      throw new Error("Produto produzido deve estar ativo");
    }

    const consumptions = [];

    for (const ingredient of recipe.scaleIngredients(input.quantityProduced)) {
      const product = await this.products.findById(ingredient.productId);

      if (!product || !product.active) {
        throw new Error("Todos os insumos devem estar ativos");
      }

      consumptions.push({
        productId: ingredient.productId,
        quantity: ingredient.quantity,
        unitCost: product.purchasePrice,
      });
    }

    const order = new ProductionOrder({
      completedAt: new Date(),
      createdAt: new Date(),
      id: crypto.randomUUID(),
      ingredientConsumptions: consumptions,
      notes: input.notes,
      outputProductId: recipe.outputProductId,
      quantityProduced: input.quantityProduced,
      recipeId: recipe.id,
      status: "completed",
    });

    const createdOrder = await this.orders.create(order);

    await this.inventory.registerProduction(createdOrder);

    return createdOrder;
  }
}
