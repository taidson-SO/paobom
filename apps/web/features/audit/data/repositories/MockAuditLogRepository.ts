import {
  AuditLog,
  AuditLogFilter,
  AuditLogRepository,
  RegisterAuditLogInput,
} from "@paobom/domain";

import { AppEvents, EventBus } from "@/core/infrastructure/events/event-bus";
import { AuditLogDTO } from "@/features/audit/data/dto/AuditDTO";
import { AuditMapper } from "@/features/audit/data/mappers/AuditMapper";

const seed: AuditLogDTO[] = [
  {
    action: "system.bootstrap",
    description: "Sistema iniciado com trilha de auditoria ativa",
    entity: "system",
    entity_id: null,
    id: "audit-seed-bootstrap",
    metadata: { source: "mock" },
    occurred_at: new Date().toISOString(),
    result: "success",
    user_id: "system",
    user_name: "Sistema",
    user_role: "system",
  },
];

export class MockAuditLogRepository implements AuditLogRepository {
  private readonly logs: AuditLogDTO[] = [...seed];

  constructor(events: EventBus<AppEvents>) {
    events.on("audit:record-requested", (payload) => {
      void this.register({
        action: payload.action,
        description: payload.description,
        entity: payload.entity,
        entityId: payload.entityId,
        metadata: payload.metadata ?? {},
        result: payload.result,
        userId: payload.userId,
        userName: payload.userName,
        userRole: payload.userRole,
      });
    });
  }

  async findAll(filter: AuditLogFilter = {}) {
    return this.logs
      .map(AuditMapper.toDomain)
      .filter((log) => matchesFilter(log, filter))
      .sort((first, second) => second.occurredAt.getTime() - first.occurredAt.getTime());
  }

  async register(input: RegisterAuditLogInput) {
    const log = new AuditLog({
      action: input.action,
      description: input.description,
      entity: input.entity,
      entityId: input.entityId,
      id: `audit-${Date.now()}-${this.logs.length + 1}`,
      metadata: input.metadata,
      occurredAt: input.occurredAt ?? new Date(),
      result: input.result,
      userId: input.userId,
      userName: input.userName,
      userRole: input.userRole,
    });

    this.logs.unshift(AuditMapper.toDTO(log));

    return log;
  }
}

function matchesFilter(log: AuditLog, filter: AuditLogFilter) {
  if (filter.action && !log.action.includes(filter.action)) {
    return false;
  }

  if (filter.entity && log.entity !== filter.entity) {
    return false;
  }

  if (filter.userId && log.userId !== filter.userId) {
    return false;
  }

  if (filter.startDate && log.occurredAt < startOfDay(filter.startDate)) {
    return false;
  }

  if (filter.endDate && log.occurredAt > endOfDay(filter.endDate)) {
    return false;
  }

  return true;
}

function startOfDay(date: Date) {
  const normalized = new Date(date);

  normalized.setHours(0, 0, 0, 0);

  return normalized;
}

function endOfDay(date: Date) {
  const normalized = new Date(date);

  normalized.setHours(23, 59, 59, 999);

  return normalized;
}
