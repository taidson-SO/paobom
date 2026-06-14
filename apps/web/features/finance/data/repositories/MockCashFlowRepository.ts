import {
  CashEntry,
  CashFlowRepository,
  RegisterCashEntryInput,
} from "@paobom/domain";

import { AppEvents, EventBus } from "@/core/infrastructure/events/event-bus";
import { CashEntryDTO } from "@/features/finance/data/dto/FinanceDTO";
import { FinanceMapper } from "@/features/finance/data/mappers/FinanceMapper";

const now = new Date();
const yesterday = new Date(now);
const tomorrow = new Date(now);

yesterday.setDate(now.getDate() - 1);
tomorrow.setDate(now.getDate() + 1);

let entries: CashEntryDTO[] = [
  {
    amount: 860,
    category: "Vendas",
    created_at: yesterday.toISOString(),
    description: "Recebimento balcao",
    due_date: yesterday.toISOString(),
    id: "cash-1",
    reference_id: null,
    settled_at: yesterday.toISOString(),
    status: "settled",
    type: "income",
    updated_at: yesterday.toISOString(),
  },
  {
    amount: 220,
    category: "Despesas fixas",
    created_at: now.toISOString(),
    description: "Energia eletrica",
    due_date: tomorrow.toISOString(),
    id: "cash-2",
    reference_id: null,
    settled_at: null,
    status: "pending",
    type: "expense",
    updated_at: now.toISOString(),
  },
];

let subscribed = false;

export class MockCashFlowRepository implements CashFlowRepository {
  constructor(events: EventBus<AppEvents>) {
    if (!subscribed) {
      events.on("finance:entry-requested", (payload) => {
        void this.register(payload).then((entry) => {
          if (payload.status === "settled") {
            return this.settle(entry.id);
          }

          return entry;
        });
      });
      subscribed = true;
    }
  }

  async cancel(id: string) {
    const entry = await this.findById(id);

    entry.cancel();
    entries = entries.map((item) =>
      item.id === id ? FinanceMapper.entryToDTO(entry) : item,
    );

    return entry;
  }

  async findAll() {
    return entries
      .map(FinanceMapper.entryToEntity)
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  }

  async register(input: RegisterCashEntryInput) {
    const entry = new CashEntry({
      amount: input.amount,
      category: input.category,
      createdAt: new Date(),
      description: input.description,
      dueDate: input.dueDate,
      id: crypto.randomUUID(),
      referenceId: input.referenceId ?? null,
      settledAt: null,
      status: "pending",
      type: input.type,
      updatedAt: new Date(),
    });

    entries = [FinanceMapper.entryToDTO(entry), ...entries];

    return entry;
  }

  async settle(id: string) {
    const entry = await this.findById(id);

    entry.settle();
    entries = entries.map((item) =>
      item.id === id ? FinanceMapper.entryToDTO(entry) : item,
    );

    return entry;
  }

  private async findById(id: string) {
    const entry = entries.find((item) => item.id === id);

    if (!entry) {
      throw new Error("Lancamento financeiro nao encontrado");
    }

    return FinanceMapper.entryToEntity(entry);
  }
}
