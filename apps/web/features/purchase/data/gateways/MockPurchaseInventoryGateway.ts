import { Purchase, PurchaseInventoryGateway } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";

export class MockPurchaseInventoryGateway implements PurchaseInventoryGateway {
  async registerReceipt(purchase: Purchase) {
    purchase.items.forEach((item) => {
      eventBus.emit("inventory:movement-requested", {
        productId: item.productId,
        quantity: item.quantity,
        reason: "Recebimento de compra",
        referenceId: purchase.id,
        type: "purchase_in",
        unitCost: item.unitCost,
      });
    });
  }
}
