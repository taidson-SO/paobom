import { Product, ProductProps } from "@paobom/domain";

import { ProductDTO } from "@/features/product/data/dto/ProductDTO";

export class ProductMapper {
  static toDTO(entity: Product): ProductDTO {
    const product = entity.toJSON();

    return {
      active: product.active,
      category: product.category,
      created_at: product.createdAt.toISOString(),
      id: product.id,
      kind: product.kind,
      minimum_stock: product.minimumStock,
      name: product.name,
      purchase_price: product.purchasePrice,
      sale_price: product.salePrice,
      sku: product.sku,
      unit: product.unit,
      updated_at: product.updatedAt.toISOString(),
    };
  }

  static toEntity(dto: ProductDTO) {
    const props: ProductProps = {
      active: dto.active,
      category: dto.category,
      createdAt: new Date(dto.created_at),
      id: dto.id,
      kind: dto.kind,
      minimumStock: dto.minimum_stock,
      name: dto.name,
      purchasePrice: dto.purchase_price,
      salePrice: dto.sale_price,
      sku: dto.sku,
      unit: dto.unit,
      updatedAt: new Date(dto.updated_at),
    };

    return new Product(props);
  }
}
