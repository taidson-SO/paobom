export type CashEntryType = "income" | "expense";

export type CashEntryStatus = "pending" | "settled" | "cancelled";

export type CashRegisterStatus = "open" | "closed";

export type CashEntryProps = {
  id: string;
  type: CashEntryType;
  status: CashEntryStatus;
  category: string;
  description: string;
  amount: number;
  dueDate: Date;
  settledAt: Date | null;
  referenceId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterCashEntryInput = {
  type: CashEntryType;
  category: string;
  description: string;
  amount: number;
  dueDate: Date;
  referenceId?: string | null;
  settledAt?: Date | null;
  status?: CashEntryStatus;
};

export type CashFlowSummary = {
  income: number;
  expense: number;
  pendingIncome: number;
  pendingExpense: number;
  balance: number;
  projectedBalance: number;
};

export type CashRegisterProps = {
  id: string;
  status: CashRegisterStatus;
  openingAmount: number;
  openedAt: Date;
  openedBy: string;
  closedAt: Date | null;
  closedBy: string | null;
  countedAmount: number | null;
  expectedAmount: number | null;
  differenceAmount: number | null;
  closingNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OpenCashRegisterInput = {
  openingAmount: number;
  openedBy: string;
};

export type CloseCashRegisterInput = {
  cashRegisterId: string;
  countedAmount: number;
  closedBy: string;
  closingNote?: string | null;
};

export type CloseCashRegisterRepositoryInput = CloseCashRegisterInput & {
  expectedAmount: number;
};

export class CashEntry {
  constructor(private props: CashEntryProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get type() {
    return this.props.type;
  }

  get status() {
    return this.props.status;
  }

  get category() {
    return this.props.category;
  }

  get description() {
    return this.props.description;
  }

  get amount() {
    return this.props.amount;
  }

  get dueDate() {
    return this.props.dueDate;
  }

  get settledAt() {
    return this.props.settledAt;
  }

  get referenceId() {
    return this.props.referenceId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  settle(settledAt = new Date()) {
    if (this.props.status === "cancelled") {
      throw new Error("Lancamento cancelado nao pode ser baixado");
    }

    this.props = {
      ...this.props,
      settledAt,
      status: "settled",
      updatedAt: new Date(),
    };
  }

  cancel() {
    if (this.props.status === "settled") {
      throw new Error("Lancamento baixado nao pode ser cancelado");
    }

    this.props = {
      ...this.props,
      status: "cancelled",
      updatedAt: new Date(),
    };
  }

  toJSON(): CashEntryProps {
    return { ...this.props };
  }

  private assertValid() {
    if (!this.props.category.trim()) {
      throw new Error("Categoria do lancamento deve ser informada");
    }

    if (!this.props.description.trim()) {
      throw new Error("Descricao do lancamento deve ser informada");
    }

    if (this.props.amount <= 0) {
      throw new Error("Valor do lancamento deve ser maior que zero");
    }
  }
}

export class CashRegister {
  constructor(private props: CashRegisterProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get status() {
    return this.props.status;
  }

  get openingAmount() {
    return this.props.openingAmount;
  }

  get openedAt() {
    return this.props.openedAt;
  }

  get openedBy() {
    return this.props.openedBy;
  }

  get closedAt() {
    return this.props.closedAt;
  }

  get closedBy() {
    return this.props.closedBy;
  }

  get countedAmount() {
    return this.props.countedAmount;
  }

  get expectedAmount() {
    return this.props.expectedAmount;
  }

  get differenceAmount() {
    return this.props.differenceAmount;
  }

  get closingNote() {
    return this.props.closingNote;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  close(input: CloseCashRegisterRepositoryInput) {
    if (this.props.status === "closed") {
      throw new Error("Caixa ja esta fechado");
    }

    const differenceAmount = input.countedAmount - input.expectedAmount;

    if (differenceAmount !== 0 && !input.closingNote?.trim()) {
      throw new Error("Fechamento com divergencia exige justificativa");
    }

    this.props = {
      ...this.props,
      closedAt: new Date(),
      closedBy: input.closedBy,
      closingNote: input.closingNote ?? null,
      countedAmount: input.countedAmount,
      differenceAmount,
      expectedAmount: input.expectedAmount,
      status: "closed",
      updatedAt: new Date(),
    };

    this.assertValid();
  }

  toJSON(): CashRegisterProps {
    return { ...this.props };
  }

  private assertValid() {
    if (this.props.openingAmount < 0) {
      throw new Error("Valor de abertura nao pode ser negativo");
    }

    if (!this.props.openedBy.trim()) {
      throw new Error("Responsavel pela abertura deve ser informado");
    }

    if (this.props.status === "closed") {
      if (!this.props.closedBy?.trim()) {
        throw new Error("Responsavel pelo fechamento deve ser informado");
      }

      if (this.props.countedAmount === null || this.props.countedAmount < 0) {
        throw new Error("Valor contado no fechamento deve ser informado");
      }
    }
  }
}

export interface CashFlowRepository {
  cancel(id: string): Promise<CashEntry>;
  findAll(): Promise<CashEntry[]>;
  register(input: RegisterCashEntryInput): Promise<CashEntry>;
  settle(id: string): Promise<CashEntry>;
}

export interface CashRegisterRepository {
  close(input: CloseCashRegisterRepositoryInput): Promise<CashRegister>;
  findCurrentOpen(): Promise<CashRegister | null>;
  findRegisters(): Promise<CashRegister[]>;
  open(input: OpenCashRegisterInput): Promise<CashRegister>;
}

export class ListCashEntriesUseCase {
  constructor(private readonly repository: CashFlowRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class RegisterCashEntryUseCase {
  constructor(private readonly repository: CashFlowRepository) {}

  execute(input: RegisterCashEntryInput) {
    return this.repository.register(input);
  }
}

export class SettleCashEntryUseCase {
  constructor(private readonly repository: CashFlowRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Lancamento nao informado");
    }

    return this.repository.settle(id);
  }
}

export class CancelCashEntryUseCase {
  constructor(private readonly repository: CashFlowRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Lancamento nao informado");
    }

    return this.repository.cancel(id);
  }
}

export class GetCashFlowSummaryUseCase {
  constructor(private readonly repository: CashFlowRepository) {}

  async execute(): Promise<CashFlowSummary> {
    const entries = await this.repository.findAll();
    const activeEntries = entries.filter((entry) => entry.status !== "cancelled");

    return activeEntries.reduce<CashFlowSummary>(
      (summary, entry) => {
        const signedAmount = entry.type === "income" ? entry.amount : -entry.amount;

        if (entry.status === "settled") {
          return {
            ...summary,
            balance: summary.balance + signedAmount,
            expense:
              entry.type === "expense"
                ? summary.expense + entry.amount
                : summary.expense,
            income:
              entry.type === "income"
                ? summary.income + entry.amount
                : summary.income,
            projectedBalance: summary.projectedBalance + signedAmount,
          };
        }

        return {
          ...summary,
          pendingExpense:
            entry.type === "expense"
              ? summary.pendingExpense + entry.amount
              : summary.pendingExpense,
          pendingIncome:
            entry.type === "income"
              ? summary.pendingIncome + entry.amount
              : summary.pendingIncome,
          projectedBalance: summary.projectedBalance + signedAmount,
        };
      },
      {
        balance: 0,
        expense: 0,
        income: 0,
        pendingExpense: 0,
        pendingIncome: 0,
        projectedBalance: 0,
      },
    );
  }
}

export class ListCashRegistersUseCase {
  constructor(private readonly repository: CashRegisterRepository) {}

  execute() {
    return this.repository.findRegisters();
  }
}

export class GetCurrentCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRepository) {}

  execute() {
    return this.repository.findCurrentOpen();
  }
}

export class OpenCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRepository) {}

  async execute(input: OpenCashRegisterInput) {
    const current = await this.repository.findCurrentOpen();

    if (current) {
      throw new Error("Ja existe um caixa aberto");
    }

    return this.repository.open(input);
  }
}

export class CloseCashRegisterUseCase {
  constructor(
    private readonly cashRegisters: CashRegisterRepository,
    private readonly cashFlow: CashFlowRepository,
  ) {}

  async execute(input: CloseCashRegisterInput) {
    if (!input.cashRegisterId) {
      throw new Error("Caixa nao informado");
    }

    const registers = await this.cashRegisters.findRegisters();
    const cashRegister = registers.find((item) => item.id === input.cashRegisterId);

    if (!cashRegister) {
      throw new Error("Caixa nao encontrado");
    }

    const entries = await this.cashFlow.findAll();
    const expectedAmount = entries.reduce((sum, entry) => {
      if (
        entry.status !== "settled" ||
        !entry.settledAt ||
        entry.settledAt < cashRegister.openedAt
      ) {
        return sum;
      }

      return sum + (entry.type === "income" ? entry.amount : -entry.amount);
    }, cashRegister.openingAmount);

    return this.cashRegisters.close({
      ...input,
      expectedAmount,
    });
  }
}
