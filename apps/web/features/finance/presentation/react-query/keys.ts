export const financeQueryKeys = {
  all: ["finance"] as const,
  cashRegisters: ["finance", "cash-registers"] as const,
  currentCashRegister: ["finance", "cash-registers", "current"] as const,
  entries: ["finance", "entries"] as const,
  summary: ["finance", "summary"] as const,
};
