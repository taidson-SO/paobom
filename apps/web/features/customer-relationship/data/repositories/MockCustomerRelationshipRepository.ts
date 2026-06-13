import {
  CustomerInteraction,
  CustomerRelationshipRepository,
  RegisterCustomerInteractionInput,
} from "@paobom/domain";

import { CustomerInteractionDTO } from "@/features/customer-relationship/data/dto/CustomerRelationshipDTO";
import { CustomerRelationshipMapper } from "@/features/customer-relationship/data/mappers/CustomerRelationshipMapper";

const now = new Date();
const yesterday = new Date(now);
const tomorrow = new Date(now);

yesterday.setDate(now.getDate() - 1);
tomorrow.setDate(now.getDate() + 1);

let interactions: CustomerInteractionDTO[] = [
  {
    created_at: yesterday.toISOString(),
    customer_id: "cus-1",
    id: "rel-1",
    next_contact_at: tomorrow.toISOString(),
    notes: "Cliente pediu retorno sobre kit de festa para fim de semana.",
    occurred_at: yesterday.toISOString(),
    status: "open",
    subject: "Orcamento de encomenda",
    type: "follow_up",
    updated_at: yesterday.toISOString(),
  },
  {
    created_at: now.toISOString(),
    customer_id: "cus-2",
    id: "rel-2",
    next_contact_at: null,
    notes: "Confirmou boa aceitacao dos paes para revenda.",
    occurred_at: now.toISOString(),
    status: "done",
    subject: "Feedback de revenda",
    type: "feedback",
    updated_at: now.toISOString(),
  },
];

export class MockCustomerRelationshipRepository
  implements CustomerRelationshipRepository
{
  async cancel(id: string) {
    const interaction = await this.findById(id);

    interaction.cancel();
    interactions = interactions.map((item) =>
      item.id === id
        ? CustomerRelationshipMapper.interactionToDTO(interaction)
        : item,
    );

    return interaction;
  }

  async complete(id: string) {
    const interaction = await this.findById(id);

    interaction.complete();
    interactions = interactions.map((item) =>
      item.id === id
        ? CustomerRelationshipMapper.interactionToDTO(interaction)
        : item,
    );

    return interaction;
  }

  async findAll() {
    return interactions
      .map(CustomerRelationshipMapper.interactionToEntity)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async register(input: RegisterCustomerInteractionInput) {
    const interaction = new CustomerInteraction({
      createdAt: new Date(),
      customerId: input.customerId,
      id: crypto.randomUUID(),
      nextContactAt: input.nextContactAt ?? null,
      notes: input.notes,
      occurredAt: input.occurredAt,
      status: "open",
      subject: input.subject,
      type: input.type,
      updatedAt: new Date(),
    });

    interactions = [
      CustomerRelationshipMapper.interactionToDTO(interaction),
      ...interactions,
    ];

    return interaction;
  }

  private async findById(id: string) {
    const interaction = interactions.find((item) => item.id === id);

    if (!interaction) {
      throw new Error("Interacao com cliente nao encontrada");
    }

    return CustomerRelationshipMapper.interactionToEntity(interaction);
  }
}
