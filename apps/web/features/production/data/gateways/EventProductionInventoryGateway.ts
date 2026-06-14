import { ProductionInventoryGateway, ProductionOrder } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";

export class EventProductionInventoryGateway
  implements ProductionInventoryGateway
{
  async registerProductionFinish(order: ProductionOrder) {
    eventBus.emit("inventory:movement-requested", {
      productId: order.outputProductId,
      quantity: order.quantityProduced,
      reason: "Entrada de producao finalizada",
      referenceId: order.id,
      type: "production_in",
      unitCost: order.quantityProduced > 0 ? order.totalCost / order.quantityProduced : 0,
    });
  }

  async registerProductionStart(order: ProductionOrder) {
    order.ingredientConsumptions.forEach((item) => {
      eventBus.emit("inventory:movement-requested", {
        productId: item.productId,
        quantity: item.quantity,
        reason: "Consumo ao iniciar producao",
        referenceId: order.id,
        type: "production_out",
        unitCost: item.unitCost,
      });
    });
  }

  async reverseProductionStart(order: ProductionOrder) {
    order.ingredientConsumptions.forEach((item) => {
      eventBus.emit("inventory:movement-requested", {
        productId: item.productId,
        quantity: item.quantity,
        reason: "Estorno de producao cancelada",
        referenceId: order.id,
        type: "production_reversal",
        unitCost: item.unitCost,
      });
    });
  }
}
