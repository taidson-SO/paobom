import {
  CashEntryStatus,
  CashEntryType,
  CashRegisterStatus,
} from "@paobom/domain";

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

export type CashRegisterDTO = {
  closed_at: string | null;
  closed_by: string | null;
  closing_note: string | null;
  counted_amount: number | null;
  created_at: string;
  difference_amount: number | null;
  expected_amount: number | null;
  id: string;
  opened_at: string;
  opened_by: string;
  opening_amount: number;
  status: CashRegisterStatus;
  updated_at: string;
};
