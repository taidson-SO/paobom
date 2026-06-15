import {
  CashEntry,
  CashFlowSummary,
  CashReconciliation,
  CashRegister,
  CashRegisterMovement,
} from "@paobom/domain";

import {
  CashEntryDTO,
  CashFlowSummaryDTO,
  CashReconciliationDTO,
  CashRegisterDTO,
  CashRegisterMovementDTO,
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

  movementToDTO(movement: CashRegisterMovement): CashRegisterMovementDTO {
    return {
      actor: movement.actor,
      amount: movement.amount,
      cash_register_id: movement.cashRegisterId,
      id: movement.id,
      occurred_at: movement.occurredAt.toISOString(),
      reason: movement.reason,
      type: movement.type,
    };
  },

  movementToEntity(dto: CashRegisterMovementDTO): CashRegisterMovement {
    return new CashRegisterMovement({
      actor: dto.actor,
      amount: dto.amount,
      cashRegisterId: dto.cash_register_id,
      id: dto.id,
      occurredAt: new Date(dto.occurred_at),
      reason: dto.reason,
      type: dto.type,
    });
  },

  reconciliationToDTO(reconciliation: CashReconciliation): CashReconciliationDTO {
    return {
      cash_register_id: reconciliation.cashRegisterId,
      counted_amount: reconciliation.countedAmount,
      difference_amount: reconciliation.differenceAmount,
      expected_amount: reconciliation.expectedAmount,
      id: reconciliation.id,
      method: reconciliation.method,
      notes: reconciliation.notes,
      reconciled_at: reconciliation.reconciledAt.toISOString(),
      reconciled_by: reconciliation.reconciledBy,
    };
  },

  reconciliationToEntity(dto: CashReconciliationDTO): CashReconciliation {
    return new CashReconciliation({
      cashRegisterId: dto.cash_register_id,
      countedAmount: dto.counted_amount,
      differenceAmount: dto.difference_amount,
      expectedAmount: dto.expected_amount,
      id: dto.id,
      method: dto.method,
      notes: dto.notes,
      reconciledAt: new Date(dto.reconciled_at),
      reconciledBy: dto.reconciled_by,
    });
  },
};
