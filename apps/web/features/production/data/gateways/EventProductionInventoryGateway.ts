import { ProductionInventoryGateway, ProductionOrder } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";

export class EventProductionInventoryGateway
  implements ProductionInventoryGateway
{
  async registerProduction(order: ProductionOrder) {
    order.ingredientConsumptions.forEach((item) => {
      eventBus.emit("inventory:movement-requested", {
        productId: item.productId,
        quantity: item.quantity,
        reason: "Consumo em producao",
        referenceId: order.id,
        type: "production_out",
        unitCost: item.unitCost,
      });
    });

    eventBus.emit("inventory:movement-requested", {
      productId: order.outputProductId,
      quantity: order.quantityProduced,
      reason: "Entrada de producao",
      referenceId: order.id,
      type: "production_in",
      unitCost: order.quantityProduced > 0 ? order.totalCost / order.quantityProduced : 0,
    });
  }
}
