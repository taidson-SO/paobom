import { Sale, SaleProps } from "@paobom/domain";

import { SaleDTO } from "@/features/sales/data/dto/SalesDTO";

export const SalesMapper = {
  toDTO(sale: Sale): SaleDTO {
    return {
      created_at: sale.createdAt.toISOString(),
      customer_id: sale.customerId,
      discount_amount: sale.discountAmount,
      discount_authorized_by: sale.discountAuthorizedBy,
      discount_reason: sale.discountReason,
      id: sale.id,
      items: sale.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        unit_price: item.unitPrice,
      })),
      notes: sale.notes,
      oversell_approved_by: sale.oversellApprovedBy,
      oversell_justification: sale.oversellJustification,
      paid_at: sale.paidAt?.toISOString() ?? null,
      payment_method: sale.paymentMethod,
      status: sale.status,
      updated_at: sale.updatedAt.toISOString(),
    };
  },

  toEntity(dto: SaleDTO): Sale {
    const props: SaleProps = {
      createdAt: new Date(dto.created_at),
      customerId: dto.customer_id,
      discountAmount: dto.discount_amount,
      discountAuthorizedBy: dto.discount_authorized_by,
      discountReason: dto.discount_reason,
      id: dto.id,
      items: dto.items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitCost: item.unit_cost,
        unitPrice: item.unit_price,
      })),
      notes: dto.notes,
      oversellApprovedBy: dto.oversell_approved_by,
      oversellJustification: dto.oversell_justification,
      paidAt: dto.paid_at ? new Date(dto.paid_at) : null,
      paymentMethod: dto.payment_method,
      status: dto.status,
      updatedAt: new Date(dto.updated_at),
    };

    return new Sale(props);
  },
};
