export type ProductUnit = "kg" | "g" | "unit" | "liter" | "package";

export type ProductProps = {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  category: string;
  purchasePrice: number;
  salePrice: number;
  minimumStock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductInput = {
  name: string;
  sku: string;
  unit: ProductUnit;
  category: string;
  purchasePrice: number;
  salePrice: number;
  minimumStock: number;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export class Product {
  constructor(private props: ProductProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get sku() {
    return this.props.sku;
  }

  get unit() {
    return this.props.unit;
  }

  get category() {
    return this.props.category;
  }

  get purchasePrice() {
    return this.props.purchasePrice;
  }

  get salePrice() {
    return this.props.salePrice;
  }

  get minimumStock() {
    return this.props.minimumStock;
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

  update(input: UpdateProductInput) {
    this.props = {
      ...this.props,
      ...input,
      updatedAt: new Date(),
    };

    this.assertValid();
  }

  activate() {
    this.props = {
      ...this.props,
      active: true,
      updatedAt: new Date(),
    };
  }

  deactivate() {
    this.props = {
      ...this.props,
      active: false,
      updatedAt: new Date(),
    };
  }

  isBelowMinimum(currentStock: number) {
    return currentStock < this.props.minimumStock;
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }

  private assertValid() {
    if (this.props.name.trim().length < 2) {
      throw new Error("Nome do produto deve ter pelo menos 2 caracteres");
    }

    if (this.props.sku.trim().length < 2) {
      throw new Error("SKU do produto deve ter pelo menos 2 caracteres");
    }

    if (this.props.purchasePrice < 0 || this.props.salePrice < 0) {
      throw new Error("Precos do produto nao podem ser negativos");
    }

    if (this.props.minimumStock < 0) {
      throw new Error("Estoque minimo nao pode ser negativo");
    }
  }
}

export interface ProductRepository {
  create(input: CreateProductInput): Promise<Product>;
  deactivate(id: string): Promise<Product>;
  findAll(): Promise<Product[]>;
  update(id: string, input: UpdateProductInput): Promise<Product>;
}

export class ListProductsUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute(input: CreateProductInput) {
    return this.repository.create(input);
  }
}

export class UpdateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute(id: string, input: UpdateProductInput) {
    if (!id) {
      throw new Error("Produto nao informado");
    }

    return this.repository.update(id, input);
  }
}

export class DeactivateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Produto nao informado");
    }

    return this.repository.deactivate(id);
  }
}
