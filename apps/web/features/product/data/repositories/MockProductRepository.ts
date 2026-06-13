import {
  CreateProductInput,
  Product,
  ProductRepository,
  UpdateProductInput,
} from "@paobom/domain";

import { ProductDTO } from "@/features/product/data/dto/ProductDTO";
import { ProductMapper } from "@/features/product/data/mappers/ProductMapper";

const now = new Date().toISOString();

let products: ProductDTO[] = [
  {
    active: true,
    category: "Insumo",
    created_at: now,
    id: "prod-1",
    minimum_stock: 25,
    name: "Farinha de trigo 25kg",
    purchase_price: 92,
    sale_price: 0,
    sku: "FAR-25KG",
    unit: "package",
    updated_at: now,
  },
  {
    active: true,
    category: "Produto acabado",
    created_at: now,
    id: "prod-2",
    minimum_stock: 100,
    name: "Pao frances",
    purchase_price: 0.22,
    sale_price: 0.65,
    sku: "PAO-FRANCES",
    unit: "unit",
    updated_at: now,
  },
];

export class MockProductRepository implements ProductRepository {
  async create(input: CreateProductInput) {
    const product = new Product({
      ...input,
      active: true,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      updatedAt: new Date(),
    });

    products = [ProductMapper.toDTO(product), ...products];

    return product;
  }

  async deactivate(id: string) {
    const product = await this.requireById(id);

    product.deactivate();
    products = products.map((item) =>
      item.id === id ? ProductMapper.toDTO(product) : item,
    );

    return product;
  }

  async findAll() {
    return products.map(ProductMapper.toEntity);
  }

  async findById(id: string) {
    const product = products.find((item) => item.id === id);

    return product ? ProductMapper.toEntity(product) : null;
  }

  async update(id: string, input: UpdateProductInput) {
    const product = await this.requireById(id);

    product.update(input);
    products = products.map((item) =>
      item.id === id ? ProductMapper.toDTO(product) : item,
    );

    return product;
  }

  private async requireById(id: string) {
    const product = await this.findById(id);

    if (!product) {
      throw new Error("Produto nao encontrado");
    }

    return product;
  }
}
