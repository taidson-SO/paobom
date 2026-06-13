import { CashEntry, CashFlowSummary } from "@paobom/domain";

import {
  CashEntryDTO,
  CashFlowSummaryDTO,
} from "@/features/finance/data/dto/FinanceDTO";

export const FinanceMapper = {
  entryToDTO(entry: CashEntry): CashEntryDTO {
    return {
      amount: entry.amount,
      category: entry.category,
      created_at: entry.createdAt.toISOString(),
      description: entry.description,
      due_date: entry.dueDate.toISOString(),
      id: entry.id,
      reference_id: entry.referenceId,
      settled_at: entry.settledAt?.toISOString() ?? null,
      status: entry.status,
      type: entry.type,
      updated_at: entry.updatedAt.toISOString(),
    };
  },

  entryToEntity(dto: CashEntryDTO): CashEntry {
    return new CashEntry({
      amount: dto.amount,
      category: dto.category,
      createdAt: new Date(dto.created_at),
      description: dto.description,
      dueDate: new Date(dto.due_date),
      id: dto.id,
      referenceId: dto.reference_id,
      settledAt: dto.settled_at ? new Date(dto.settled_at) : null,
      status: dto.status,
      type: dto.type,
      updatedAt: new Date(dto.updated_at),
    });
  },

  summaryToDTO(summary: CashFlowSummary): CashFlowSummaryDTO {
    return {
      balance: summary.balance,
      expense: summary.expense,
      income: summary.income,
      pending_expense: summary.pendingExpense,
      pending_income: summary.pendingIncome,
      projected_balance: summary.projectedBalance,
    };
  },
};
