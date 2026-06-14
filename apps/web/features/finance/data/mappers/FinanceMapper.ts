import { CashEntry, CashFlowSummary, CashRegister } from "@paobom/domain";

import {
  CashEntryDTO,
  CashFlowSummaryDTO,
  CashRegisterDTO,
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

  registerToDTO(register: CashRegister): CashRegisterDTO {
    return {
      closed_at: register.closedAt?.toISOString() ?? null,
      closed_by: register.closedBy,
      closing_note: register.closingNote,
      counted_amount: register.countedAmount,
      created_at: register.createdAt.toISOString(),
      difference_amount: register.differenceAmount,
      expected_amount: register.expectedAmount,
      id: register.id,
      opened_at: register.openedAt.toISOString(),
      opened_by: register.openedBy,
      opening_amount: register.openingAmount,
      status: register.status,
      updated_at: register.updatedAt.toISOString(),
    };
  },

  registerToEntity(dto: CashRegisterDTO): CashRegister {
    return new CashRegister({
      closedAt: dto.closed_at ? new Date(dto.closed_at) : null,
      closedBy: dto.closed_by,
      closingNote: dto.closing_note,
      countedAmount: dto.counted_amount,
      createdAt: new Date(dto.created_at),
      differenceAmount: dto.difference_amount,
      expectedAmount: dto.expected_amount,
      id: dto.id,
      openedAt: new Date(dto.opened_at),
      openedBy: dto.opened_by,
      openingAmount: dto.opening_amount,
      status: dto.status,
      updatedAt: new Date(dto.updated_at),
    });
  },
};
