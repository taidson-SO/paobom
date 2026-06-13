import { CustomerRepository } from "./customer";

export type CustomerInteractionType =
  | "order"
  | "feedback"
  | "complaint"
  | "follow_up"
  | "campaign";

export type CustomerInteractionStatus = "open" | "done" | "cancelled";

export type CustomerInteractionProps = {
  id: string;
  customerId: string;
  type: CustomerInteractionType;
  status: CustomerInteractionStatus;
  subject: string;
  notes: string;
  occurredAt: Date;
  nextContactAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterCustomerInteractionInput = {
  customerId: string;
  type: CustomerInteractionType;
  subject: string;
  notes: string;
  occurredAt: Date;
  nextContactAt?: Date | null;
};

export type CustomerRelationshipSummary = {
  totalInteractions: number;
  openFollowUps: number;
  completedInteractions: number;
  nextContactAt: Date | null;
  interactionsByType: Record<CustomerInteractionType, number>;
};

export class CustomerInteraction {
  constructor(private props: CustomerInteractionProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get customerId() {
    return this.props.customerId;
  }

  get type() {
    return this.props.type;
  }

  get status() {
    return this.props.status;
  }

  get subject() {
    return this.props.subject;
  }

  get notes() {
    return this.props.notes;
  }

  get occurredAt() {
    return this.props.occurredAt;
  }

  get nextContactAt() {
    return this.props.nextContactAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  complete() {
    if (this.props.status === "cancelled") {
      throw new Error("Interacao cancelada nao pode ser concluida");
    }

    this.props = {
      ...this.props,
      status: "done",
      updatedAt: new Date(),
    };
  }

  cancel() {
    if (this.props.status === "done") {
      throw new Error("Interacao concluida nao pode ser cancelada");
    }

    this.props = {
      ...this.props,
      status: "cancelled",
      updatedAt: new Date(),
    };
  }

  toJSON(): CustomerInteractionProps {
    return { ...this.props };
  }

  private assertValid() {
    if (!this.props.customerId) {
      throw new Error("Cliente da interacao deve ser informado");
    }

    if (this.props.subject.trim().length < 3) {
      throw new Error("Assunto da interacao deve ter pelo menos 3 caracteres");
    }
  }
}

export interface CustomerRelationshipRepository {
  cancel(id: string): Promise<CustomerInteraction>;
  complete(id: string): Promise<CustomerInteraction>;
  findAll(): Promise<CustomerInteraction[]>;
  register(input: RegisterCustomerInteractionInput): Promise<CustomerInteraction>;
}

export class ListCustomerInteractionsUseCase {
  constructor(private readonly repository: CustomerRelationshipRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class RegisterCustomerInteractionUseCase {
  constructor(
    private readonly repository: CustomerRelationshipRepository,
    private readonly customers: CustomerRepository,
  ) {}

  async execute(input: RegisterCustomerInteractionInput) {
    const customer = await this.customers.findById(input.customerId);

    if (!customer || !customer.active) {
      throw new Error("Cliente ativo deve ser informado para a interacao");
    }

    return this.repository.register(input);
  }
}

export class CompleteCustomerInteractionUseCase {
  constructor(private readonly repository: CustomerRelationshipRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Interacao nao informada");
    }

    return this.repository.complete(id);
  }
}

export class CancelCustomerInteractionUseCase {
  constructor(private readonly repository: CustomerRelationshipRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Interacao nao informada");
    }

    return this.repository.cancel(id);
  }
}

export class GetCustomerRelationshipSummaryUseCase {
  constructor(private readonly repository: CustomerRelationshipRepository) {}

  async execute(): Promise<CustomerRelationshipSummary> {
    const interactions = await this.repository.findAll();
    const activeInteractions = interactions.filter(
      (interaction) => interaction.status !== "cancelled",
    );
    const nextContactAt = activeInteractions
      .filter((interaction) => interaction.status === "open")
      .map((interaction) => interaction.nextContactAt)
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    return activeInteractions.reduce<CustomerRelationshipSummary>(
      (summary, interaction) => ({
        completedInteractions:
          interaction.status === "done"
            ? summary.completedInteractions + 1
            : summary.completedInteractions,
        interactionsByType: {
          ...summary.interactionsByType,
          [interaction.type]: summary.interactionsByType[interaction.type] + 1,
        },
        nextContactAt,
        openFollowUps:
          interaction.status === "open"
            ? summary.openFollowUps + 1
            : summary.openFollowUps,
        totalInteractions: summary.totalInteractions + 1,
      }),
      {
        completedInteractions: 0,
        interactionsByType: {
          campaign: 0,
          complaint: 0,
          feedback: 0,
          follow_up: 0,
          order: 0,
        },
        nextContactAt,
        openFollowUps: 0,
        totalInteractions: 0,
      },
    );
  }
}
