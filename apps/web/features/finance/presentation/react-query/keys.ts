export const financeQueryKeys = {
  all: ["finance"] as const,
  cashReconciliations: ["finance", "cash-registers", "reconciliations"] as const,
  cashRegisterMovements: ["finance", "cash-registers", "movements"] as const,
  cashRegisters: ["finance", "cash-registers"] as const,
  currentCashRegister: ["finance", "cash-registers", "current"] as const,
  entries: ["finance", "entries"] as const,
  summary: ["finance", "summary"] as const,
};
