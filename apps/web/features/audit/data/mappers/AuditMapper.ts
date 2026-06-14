import { AuditLog, AuditLogProps } from "@paobom/domain";

import { AuditLogDTO } from "@/features/audit/data/dto/AuditDTO";

export const AuditMapper = {
  toDomain(dto: AuditLogDTO) {
    return new AuditLog({
      action: dto.action,
      description: dto.description,
      entity: dto.entity,
      entityId: dto.entity_id,
      id: dto.id,
      metadata: dto.metadata,
      occurredAt: new Date(dto.occurred_at),
      result: dto.result,
      userId: dto.user_id,
      userName: dto.user_name,
      userRole: dto.user_role,
    });
  },
  toDTO(log: AuditLog): AuditLogDTO {
    const json: AuditLogProps = log.toJSON();

    return {
      action: json.action,
      description: json.description,
      entity: json.entity,
      entity_id: json.entityId,
      id: json.id,
      metadata: json.metadata,
      occurred_at: json.occurredAt.toISOString(),
      result: json.result,
      user_id: json.userId,
      user_name: json.userName,
      user_role: json.userRole,
    };
  },
};
