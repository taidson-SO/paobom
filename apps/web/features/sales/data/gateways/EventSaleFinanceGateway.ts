import { Sale, SaleFinanceGateway } from "@paobom/domain";

import { eventBus } from "@/core/infrastructure/events/event-bus";

export class EventSaleFinanceGateway implements SaleFinanceGateway {
  async registerReceivable(sale: Sale) {
    eventBus.emit("finance:entry-requested", {
      amount: sale.total,
      category: "Vendas",
      description: sale.paymentMethod === "invoice" ? "Venda a prazo" : "Venda",
      dueDate: sale.paidAt ?? new Date(),
      referenceId: sale.id,
      settledAt: sale.paidAt,
      status: sale.status === "paid" ? "settled" : "pending",
      type: "income",
    });
  }
}
