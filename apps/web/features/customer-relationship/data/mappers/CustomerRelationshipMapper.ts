import {
  CustomerInteraction,
  CustomerRelationshipSummary,
} from "@paobom/domain";

import {
  CustomerInteractionDTO,
  CustomerRelationshipSummaryDTO,
} from "@/features/customer-relationship/data/dto/CustomerRelationshipDTO";

export const CustomerRelationshipMapper = {
  interactionToDTO(interaction: CustomerInteraction): CustomerInteractionDTO {
    return {
      created_at: interaction.createdAt.toISOString(),
      customer_id: interaction.customerId,
      id: interaction.id,
      next_contact_at: interaction.nextContactAt?.toISOString() ?? null,
      notes: interaction.notes,
      occurred_at: interaction.occurredAt.toISOString(),
      status: interaction.status,
      subject: interaction.subject,
      type: interaction.type,
      updated_at: interaction.updatedAt.toISOString(),
    };
  },

  interactionToEntity(dto: CustomerInteractionDTO): CustomerInteraction {
    return new CustomerInteraction({
      createdAt: new Date(dto.created_at),
      customerId: dto.customer_id,
      id: dto.id,
      nextContactAt: dto.next_contact_at ? new Date(dto.next_contact_at) : null,
      notes: dto.notes,
      occurredAt: new Date(dto.occurred_at),
      status: dto.status,
      subject: dto.subject,
      type: dto.type,
      updatedAt: new Date(dto.updated_at),
    });
  },

  summaryToDTO(
    summary: CustomerRelationshipSummary,
  ): CustomerRelationshipSummaryDTO {
    return {
      completed_interactions: summary.completedInteractions,
      interactions_by_type: summary.interactionsByType,
      next_contact_at: summary.nextContactAt?.toISOString() ?? null,
      open_follow_ups: summary.openFollowUps,
      total_interactions: summary.totalInteractions,
    };
  },
};
