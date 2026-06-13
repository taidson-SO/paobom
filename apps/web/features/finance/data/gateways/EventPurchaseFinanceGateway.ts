import { Purchase, PurchaseFinanceGateway } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";

export class EventPurchaseFinanceGateway implements PurchaseFinanceGateway {
  async registerPayable(purchase: Purchase) {
    eventBus.emit("finance:entry-requested", {
      amount: purchase.total,
      category: "Compras",
      description: "Compra de fornecedor",
      dueDate: purchase.expectedDate,
      referenceId: purchase.id,
      type: "expense",
    });
  }
}
