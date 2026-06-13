export type CashEntryType = "income" | "expense";

export type CashEntryStatus = "pending" | "settled" | "cancelled";

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
};

export type CashFlowSummary = {
  income: number;
  expense: number;
  pendingIncome: number;
  pendingExpense: number;
  balance: number;
  projectedBalance: number;
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

  settle() {
    if (this.props.status === "cancelled") {
      throw new Error("Lancamento cancelado nao pode ser baixado");
    }

    this.props = {
      ...this.props,
      settledAt: new Date(),
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

export interface CashFlowRepository {
  cancel(id: string): Promise<CashEntry>;
  findAll(): Promise<CashEntry[]>;
  register(input: RegisterCashEntryInput): Promise<CashEntry>;
  settle(id: string): Promise<CashEntry>;
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
