import { Purchase, PurchaseProps } from "@paobom/domain";

import { PurchaseDTO } from "@/features/purchase/data/dto/PurchaseDTO";

export class PurchaseMapper {
  static toDTO(entity: Purchase): PurchaseDTO {
    const purchase = entity.toJSON();

    return {
      created_at: purchase.createdAt.toISOString(),
      expected_date: purchase.expectedDate.toISOString(),
      id: purchase.id,
      items: purchase.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
      })),
      notes: purchase.notes,
      received_at: purchase.receivedAt?.toISOString() ?? null,
      status: purchase.status,
      supplier_id: purchase.supplierId,
      updated_at: purchase.updatedAt.toISOString(),
    };
  }

  static toEntity(dto: PurchaseDTO) {
    const props: PurchaseProps = {
      createdAt: new Date(dto.created_at),
      expectedDate: new Date(dto.expected_date),
      id: dto.id,
      items: dto.items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitCost: item.unit_cost,
      })),
      notes: dto.notes,
      receivedAt: dto.received_at ? new Date(dto.received_at) : null,
      status: dto.status,
      supplierId: dto.supplier_id,
      updatedAt: new Date(dto.updated_at),
    };

    return new Purchase(props);
  }
}
