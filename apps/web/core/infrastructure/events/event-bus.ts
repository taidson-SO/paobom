export type AppEvents = {
  "health:checked": {
    status: string;
  };
  "inventory:movement-requested": {
    productId: string;
    quantity: number;
    reason: string;
    referenceId: string | null;
    type:
      | "purchase_in"
      | "purchase_reversal"
      | "production_out"
      | "production_in"
      | "sale_out";
    unitCost: number;
  };
  "finance:entry-requested": {
    amount: number;
    category: string;
    description: string;
    dueDate: Date;
    referenceId: string | null;
    settledAt?: Date | null;
    status?: "pending" | "settled" | "cancelled";
    type: "income" | "expense";
  };
};

type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventBus<TEvents extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof TEvents, EventHandler<unknown>[]>();

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]) {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }

  on<TKey extends keyof TEvents>(
    event: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ) {
    const handlers = this.listeners.get(event) ?? [];

    handlers.push(handler as EventHandler<unknown>);
    this.listeners.set(event, handlers);

    return () => this.off(event, handler);
  }

  off<TKey extends keyof TEvents>(
    event: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ) {
    const handlers = this.listeners.get(event) ?? [];

    this.listeners.set(
      event,
      handlers.filter((item) => item !== handler),
    );
  }
}

export const eventBus = new EventBus<AppEvents>();
