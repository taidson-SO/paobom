import {
  CustomerInteractionStatus,
  CustomerInteractionType,
} from "@paobom/domain";

export type CustomerInteractionDTO = {
  id: string;
  created_at: string;
  customer_id: string;
  next_contact_at: string | null;
  notes: string;
  occurred_at: string;
  status: CustomerInteractionStatus;
  subject: string;
  type: CustomerInteractionType;
  updated_at: string;
};

export type CustomerRelationshipSummaryDTO = {
  completed_interactions: number;
  interactions_by_type: Record<CustomerInteractionType, number>;
  next_contact_at: string | null;
  open_follow_ups: number;
  total_interactions: number;
};
