import { Sale, SaleInventoryGateway } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";

export class EventSaleInventoryGateway implements SaleInventoryGateway {
  async registerSale(sale: Sale) {
    sale.items.forEach((item) => {
      eventBus.emit("inventory:movement-requested", {
        productId: item.productId,
        quantity: item.quantity,
        reason: "Saida por venda",
        referenceId: sale.id,
        type: "sale_out",
        unitCost: item.unitCost,
      });
    });
  }
}
