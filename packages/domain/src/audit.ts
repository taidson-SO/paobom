export type AuditActionResult = "success" | "failure";

export type AuditLogProps = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string;
  userName: string;
  userRole: string;
  result: AuditActionResult;
  description: string;
  metadata: Record<string, string | number | boolean | null>;
  occurredAt: Date;
};

export type RegisterAuditLogInput = Omit<AuditLogProps, "id" | "occurredAt"> & {
  occurredAt?: Date;
};

export type AuditLogFilter = {
  action?: string;
  entity?: string;
  userId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

export class AuditLog {
  constructor(private readonly props: AuditLogProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get action() {
    return this.props.action;
  }

  get entity() {
    return this.props.entity;
  }

  get entityId() {
    return this.props.entityId;
  }

  get userId() {
    return this.props.userId;
  }

  get userName() {
    return this.props.userName;
  }

  get userRole() {
    return this.props.userRole;
  }

  get result() {
    return this.props.result;
  }

  get description() {
    return this.props.description;
  }

  get metadata() {
    return { ...this.props.metadata };
  }

  get occurredAt() {
    return this.props.occurredAt;
  }

  toJSON(): AuditLogProps {
    return {
      ...this.props,
      metadata: this.metadata,
    };
  }

  private assertValid() {
    if (!this.props.action.trim()) {
      throw new Error("Acao da auditoria deve ser informada");
    }

    if (!this.props.entity.trim()) {
      throw new Error("Entidade da auditoria deve ser informada");
    }

    if (!this.props.userId.trim()) {
      throw new Error("Usuario da auditoria deve ser informado");
    }

    if (!this.props.description.trim()) {
      throw new Error("Descricao da auditoria deve ser informada");
    }
  }
}

export interface AuditLogRepository {
  findAll(filter?: AuditLogFilter): Promise<AuditLog[]>;
  register(input: RegisterAuditLogInput): Promise<AuditLog>;
}

export class ListAuditLogsUseCase {
  constructor(private readonly repository: AuditLogRepository) {}

  execute(filter?: AuditLogFilter) {
    return this.repository.findAll(filter);
  }
}

export class RegisterAuditLogUseCase {
  constructor(private readonly repository: AuditLogRepository) {}

  execute(input: RegisterAuditLogInput) {
    return this.repository.register(input);
  }
}
