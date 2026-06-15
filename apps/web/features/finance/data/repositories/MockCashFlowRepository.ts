import {
  CashEntry,
  CashFlowRepository,
  CashReconciliation,
  CashRegister,
  CashRegisterMovement,
  CashRegisterRepository,
  CloseCashRegisterRepositoryInput,
  OpenCashRegisterInput,
  RegisterCashEntryInput,
  RegisterCashRegisterMovementInput,
  ReconcileCashRegisterInput,
} from "@paobom/domain";

import { AppEvents, EventBus } from "@/core/infrastructure/events/event-bus";
import {
  CashEntryDTO,
  CashReconciliationDTO,
  CashRegisterDTO,
  CashRegisterMovementDTO,
} from "@/features/finance/data/dto/FinanceDTO";
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

let registers: CashRegisterDTO[] = [];
let movements: CashRegisterMovementDTO[] = [];
let reconciliations: CashReconciliationDTO[] = [];

let subscribed = false;

export class MockCashFlowRepository
  implements CashFlowRepository, CashRegisterRepository
{
  constructor(events: EventBus<AppEvents>) {
    if (!subscribed) {
      events.on("finance:entry-requested", (payload) => {
        void this.register(payload);
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

  async close(input: CloseCashRegisterRepositoryInput) {
    const register = await this.requireRegisterById(input.cashRegisterId);

    register.close(input);
    registers = registers.map((item) =>
      item.id === input.cashRegisterId
        ? FinanceMapper.registerToDTO(register)
        : item,
    );

    return register;
  }

  async findCurrentOpen() {
    const current = registers.find((item) => item.status === "open");

    return current ? FinanceMapper.registerToEntity(current) : null;
  }

  async findMovements() {
    return movements
      .map(FinanceMapper.movementToEntity)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async findReconciliations() {
    return reconciliations
      .map(FinanceMapper.reconciliationToEntity)
      .sort((a, b) => b.reconciledAt.getTime() - a.reconciledAt.getTime());
  }

  async findRegisters() {
    return registers
      .map(FinanceMapper.registerToEntity)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
  }

  async open(input: OpenCashRegisterInput) {
    const register = new CashRegister({
      closedAt: null,
      closedBy: null,
      closingNote: null,
      countedAmount: null,
      createdAt: new Date(),
      differenceAmount: null,
      expectedAmount: null,
      id: crypto.randomUUID(),
      openedAt: new Date(),
      openedBy: input.openedBy,
      openingAmount: input.openingAmount,
      status: "open",
      updatedAt: new Date(),
    });

    registers = [FinanceMapper.registerToDTO(register), ...registers];

    return register;
  }

  async reconcile(input: ReconcileCashRegisterInput) {
    await this.requireRegisterById(input.cashRegisterId);
    const reconciliation = new CashReconciliation({
      cashRegisterId: input.cashRegisterId,
      countedAmount: input.countedAmount,
      differenceAmount: input.countedAmount - input.expectedAmount,
      expectedAmount: input.expectedAmount,
      id: crypto.randomUUID(),
      method: input.method,
      notes: input.notes ?? null,
      reconciledAt: new Date(),
      reconciledBy: input.reconciledBy,
    });

    reconciliations = [
      FinanceMapper.reconciliationToDTO(reconciliation),
      ...reconciliations,
    ];

    return reconciliation;
  }

  async register(input: RegisterCashEntryInput) {
    const current = input.referenceId
      ? entries.find((entry) => entry.reference_id === input.referenceId)
      : null;
    const entry = new CashEntry({
      amount: input.amount,
      category: input.category,
      createdAt: current ? new Date(current.created_at) : new Date(),
      description: input.description,
      dueDate: input.dueDate,
      id: current?.id ?? crypto.randomUUID(),
      referenceId: input.referenceId ?? null,
      settledAt: input.settledAt ?? null,
      status: input.status ?? "pending",
      type: input.type,
      updatedAt: new Date(),
    });
    const dto = FinanceMapper.entryToDTO(entry);

    entries = current
      ? entries.map((item) => (item.id === current.id ? dto : item))
      : [dto, ...entries];

    return entry;
  }

  async registerMovement(input: RegisterCashRegisterMovementInput) {
    await this.requireRegisterById(input.cashRegisterId);
    const movement = new CashRegisterMovement({
      actor: input.actor,
      amount: input.amount,
      cashRegisterId: input.cashRegisterId,
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      reason: input.reason,
      type: input.type,
    });

    movements = [FinanceMapper.movementToDTO(movement), ...movements];

    return movement;
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

  private async requireRegisterById(id: string) {
    const register = registers.find((item) => item.id === id);

    if (!register) {
      throw new Error("Caixa nao encontrado");
    }

    return FinanceMapper.registerToEntity(register);
  }
}
