import { CashEntryStatus, CashEntryType } from "@paobom/domain";

export type CashEntryDTO = {
  id: string;
  amount: number;
  category: string;
  created_at: string;
  description: string;
  due_date: string;
  reference_id: string | null;
  settled_at: string | null;
  status: CashEntryStatus;
  type: CashEntryType;
  updated_at: string;
};

export type CashFlowSummaryDTO = {
  balance: number;
  expense: number;
  income: number;
  pending_expense: number;
  pending_income: number;
  projected_balance: number;
};
