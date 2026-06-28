"use client";

import {
  CashEntryStatus,
  CashEntryType,
  CashRegisterMovementType,
} from "@paobom/domain";
import { FormEvent, useState } from "react";

import { useAuditRecorder } from "@/core/audit/useAuditRecorder";
import { PermissionNotice } from "@/core/permissions/PermissionGate";
import { usePermissionSession } from "@/core/permissions/permission-session";
import { useFinance } from "@/features/finance/presentation/hooks/useFinance";
import {
  CashEntrySchema,
  CashReconciliationSchema,
  CashRegisterMovementSchema,
  CloseCashRegisterSchema,
  OpenCashRegisterSchema,
} from "@/features/finance/schemas/FinanceSchema";

type FinanceForm = {
  amount: number;
  category: string;
  description: string;
  dueDate: string;
  type: CashEntryType;
};

type OpenRegisterForm = {
  openedBy: string;
  openingAmount: number;
};

type CloseRegisterForm = {
  closedBy: string;
  closingNote: string;
  countedAmount: number;
};

type RegisterMovementForm = {
  actor: string;
  amount: number;
  reason: string;
  type: CashRegisterMovementType;
};

type ReconciliationForm = {
  countedAmount: number;
  expectedAmount: number;
  method: string;
  notes: string;
  reconciledBy: string;
};

const initialForm: FinanceForm = {
  amount: 0,
  category: "Vendas",
  description: "",
  dueDate: new Date().toISOString().slice(0, 10),
  type: "income",
};

const initialOpenRegisterForm: OpenRegisterForm = {
  openedBy: "",
  openingAmount: 0,
};

const initialCloseRegisterForm: CloseRegisterForm = {
  closedBy: "",
  closingNote: "",
  countedAmount: 0,
};

const initialMovementForm: RegisterMovementForm = {
  actor: "",
  amount: 0,
  reason: "",
  type: "supply",
};

const initialReconciliationForm: ReconciliationForm = {
  countedAmount: 0,
  expectedAmount: 0,
  method: "cash",
  notes: "",
  reconciledBy: "",
};

export function FinanceSection() {
  const {
    cancelCashEntry,
    cashReconciliations,
    cashRegisterMovements,
    cashRegisters,
    closeCashRegister,
    currentCashRegister,
    filteredEntries,
    openCashRegister,
    reconcileCashRegister,
    registerCashRegisterMovement,
    registerCashEntry,
    selectedStatus,
    setSelectedStatus,
    settleCashEntry,
    summary,
  } = useFinance();
  const { can } = usePermissionSession();
  const { recordAudit } = useAuditRecorder();
  const canRegisterEntry = can("finance:register-entry");
  const canSettleEntry = can("finance:settle");
  const canCancelEntry = can("finance:cancel");
  const canOpenRegister = can("finance:open-register");
  const canCloseRegister = can("finance:close-register");
  const [form, setForm] = useState<FinanceForm>(initialForm);
  const [openRegisterForm, setOpenRegisterForm] = useState<OpenRegisterForm>(
    initialOpenRegisterForm,
  );
  const [closeRegisterForm, setCloseRegisterForm] =
    useState<CloseRegisterForm>(initialCloseRegisterForm);
  const [movementForm, setMovementForm] =
    useState<RegisterMovementForm>(initialMovementForm);
  const [reconciliationForm, setReconciliationForm] =
    useState<ReconciliationForm>(initialReconciliationForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRegisterEntry) {
      setError("Seu perfil nao pode registrar lancamentos financeiros.");
      return;
    }

    setError(null);

    try {
      const input = CashEntrySchema.parse(form);

      const entry = await registerCashEntry.mutateAsync(input);
      recordAudit({
        action: "cash_entry.create",
        description: `Lancamento ${entry.description} registrado`,
        entity: "cash_entry",
        entityId: entry.id,
        metadata: {
          amount: entry.amount,
          category: entry.category,
          type: entry.type,
        },
      });
      setForm(initialForm);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Lancamento financeiro invalido",
      );
    }
  }

  async function handleOpenRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canOpenRegister) {
      setError("Seu perfil nao pode abrir caixa.");
      return;
    }

    setError(null);

    try {
      const input = OpenCashRegisterSchema.parse(openRegisterForm);

      const register = await openCashRegister.mutateAsync(input);
      recordAudit({
        action: "cash_register.open",
        description: `Caixa ${register.id} aberto`,
        entity: "cash_register",
        entityId: register.id,
        metadata: {
          openedBy: register.openedBy,
          openingAmount: register.openingAmount,
        },
      });
      setOpenRegisterForm(initialOpenRegisterForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Abertura invalida");
    }
  }

  async function handleCloseRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCloseRegister) {
      setError("Seu perfil nao pode fechar caixa.");
      return;
    }

    setError(null);

    if (!currentCashRegister) {
      setError("Nenhum caixa aberto");
      return;
    }

    try {
      const input = CloseCashRegisterSchema.parse({
        ...closeRegisterForm,
        cashRegisterId: currentCashRegister.id,
        closingNote: closeRegisterForm.closingNote || null,
      });

      const register = await closeCashRegister.mutateAsync(input);
      recordAudit({
        action: "cash_register.close",
        description: `Caixa ${register.id} fechado`,
        entity: "cash_register",
        entityId: register.id,
        metadata: {
          countedAmount: register.countedAmount,
          differenceAmount: register.differenceAmount,
        },
      });
      setCloseRegisterForm(initialCloseRegisterForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Fechamento invalido");
    }
  }

  async function handleRegisterMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRegisterEntry) {
      setError("Seu perfil nao pode registrar movimentacoes de caixa.");
      return;
    }

    if (!currentCashRegister) {
      setError("Nenhum caixa aberto");
      return;
    }

    setError(null);

    try {
      const input = CashRegisterMovementSchema.parse({
        ...movementForm,
        cashRegisterId: currentCashRegister.id,
      });
      const movement = await registerCashRegisterMovement.mutateAsync(input);

      recordAudit({
        action: `cash_register.${movement.type}`,
        description: `Movimentacao de caixa ${movement.reason}`,
        entity: "cash_register",
        entityId: movement.cashRegisterId,
        metadata: {
          amount: movement.amount,
          movementId: movement.id,
          type: movement.type,
        },
      });
      setMovementForm(initialMovementForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Movimentacao invalida");
    }
  }

  async function handleReconcileRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCloseRegister) {
      setError("Seu perfil nao pode conciliar caixa.");
      return;
    }

    if (!currentCashRegister) {
      setError("Nenhum caixa aberto");
      return;
    }

    setError(null);

    try {
      const input = CashReconciliationSchema.parse({
        ...reconciliationForm,
        cashRegisterId: currentCashRegister.id,
        notes: reconciliationForm.notes || null,
      });
      const reconciliation = await reconcileCashRegister.mutateAsync(input);

      recordAudit({
        action: "cash_register.reconcile",
        description: `Conciliacao ${reconciliation.method}`,
        entity: "cash_register",
        entityId: reconciliation.cashRegisterId,
        metadata: {
          differenceAmount: reconciliation.differenceAmount,
          reconciliationId: reconciliation.id,
        },
      });
      setReconciliationForm(initialReconciliationForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Conciliacao invalida");
    }
  }

  return (
    <section className="brand-card grid gap-4 p-4 xl:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <div>
          <p className="brand-kicker text-sm">Financeiro</p>
          <h2 className="brand-section-title text-xl">Fluxo de caixa</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Saldo realizado" value={summary.balance} />
          <Metric label="Saldo projetado" value={summary.projectedBalance} />
          <Metric label="Entradas pagas" value={summary.income} />
          <Metric label="Saidas pagas" value={summary.expense} />
        </div>

        <div className="brand-card-warm p-3">
          <h3 className="brand-section-title text-sm">
            {currentCashRegister ? "Caixa aberto" : "Abrir caixa"}
          </h3>
          {currentCashRegister ? (
            <form className="mt-3 space-y-3" onSubmit={handleCloseRegister}>
              {!canCloseRegister ? (
                <PermissionNotice description="Voce pode consultar o caixa aberto, mas nao fecha-lo." />
              ) : null}
              <div className="rounded-md border border-[#c4d8a8] bg-[#f4f9ec] p-3 text-sm text-[var(--brand-leaf)]">
                <p className="font-bold">
                  Aberto por {currentCashRegister.openedBy}
                </p>
                <p>
                  Inicial: R$ {currentCashRegister.openingAmount.toFixed(2)} ·{" "}
                  {currentCashRegister.openedAt.toLocaleDateString()}
                </p>
              </div>
              <NumberField
                label="Valor contado"
                value={closeRegisterForm.countedAmount}
                onChange={(countedAmount) =>
                  setCloseRegisterForm((state) => ({
                    ...state,
                    countedAmount,
                  }))
                }
              />
              <TextField
                label="Responsavel"
                value={closeRegisterForm.closedBy}
                onChange={(closedBy) =>
                  setCloseRegisterForm((state) => ({ ...state, closedBy }))
                }
              />
              <TextField
                label="Justificativa se houver divergencia"
                value={closeRegisterForm.closingNote}
                onChange={(closingNote) =>
                  setCloseRegisterForm((state) => ({ ...state, closingNote }))
                }
              />
              <button
                className="brand-primary-button px-4 py-2 text-sm"
                disabled={!canCloseRegister}
              >
                Fechar caixa
              </button>
            </form>
          ) : (
            <form className="mt-3 space-y-3" onSubmit={handleOpenRegister}>
              {!canOpenRegister ? (
                <PermissionNotice description="Voce pode consultar caixas, mas nao abrir um novo caixa." />
              ) : null}
              <NumberField
                label="Valor inicial"
                value={openRegisterForm.openingAmount}
                onChange={(openingAmount) =>
                  setOpenRegisterForm((state) => ({ ...state, openingAmount }))
                }
              />
              <TextField
                label="Responsavel"
                value={openRegisterForm.openedBy}
                onChange={(openedBy) =>
                  setOpenRegisterForm((state) => ({ ...state, openedBy }))
                }
              />
              <button
                className="brand-primary-button px-4 py-2 text-sm"
                disabled={!canOpenRegister}
              >
                Abrir caixa
              </button>
            </form>
          )}
        </div>

        {currentCashRegister ? (
          <div className="brand-card-warm grid gap-3 p-3">
            <h3 className="brand-section-title text-sm">
              Movimentacao de gaveta
            </h3>
            <form className="space-y-3" onSubmit={handleRegisterMovement}>
              <div className="grid grid-cols-2 gap-2">
                <label className="brand-muted grid gap-1 text-sm font-medium">
                  Tipo
                  <select
                    className="brand-input px-3 py-2"
                    value={movementForm.type}
                    onChange={(event) =>
                      setMovementForm((state) => ({
                        ...state,
                        type: event.target.value as CashRegisterMovementType,
                      }))
                    }
                  >
                    <option value="supply">Suprimento</option>
                    <option value="withdrawal">Sangria</option>
                  </select>
                </label>
                <NumberField
                  label="Valor"
                  value={movementForm.amount}
                  onChange={(amount) =>
                    setMovementForm((state) => ({ ...state, amount }))
                  }
                />
              </div>
              <TextField
                label="Motivo"
                value={movementForm.reason}
                onChange={(reason) =>
                  setMovementForm((state) => ({ ...state, reason }))
                }
              />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField
                    label="Responsavel"
                    value={movementForm.actor}
                    onChange={(actor) =>
                      setMovementForm((state) => ({ ...state, actor }))
                    }
                  />
                </div>
                <button
                  className="brand-primary-button px-4 py-2 text-sm"
                  disabled={!canRegisterEntry}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {currentCashRegister ? (
          <div className="brand-card-warm grid gap-3 p-3">
            <h3 className="brand-section-title text-sm">Conciliacao</h3>
            <form className="space-y-3" onSubmit={handleReconcileRegister}>
              <label className="brand-muted grid gap-1 text-sm font-medium">
                Forma
                <select
                  className="brand-input px-3 py-2"
                  value={reconciliationForm.method}
                  onChange={(event) =>
                    setReconciliationForm((state) => ({
                      ...state,
                      method: event.target.value,
                    }))
                  }
                >
                  <option value="cash">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="card">Cartao</option>
                  <option value="invoice">A prazo</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Esperado"
                  value={reconciliationForm.expectedAmount}
                  onChange={(expectedAmount) =>
                    setReconciliationForm((state) => ({
                      ...state,
                      expectedAmount,
                    }))
                  }
                />
                <NumberField
                  label="Contado"
                  value={reconciliationForm.countedAmount}
                  onChange={(countedAmount) =>
                    setReconciliationForm((state) => ({
                      ...state,
                      countedAmount,
                    }))
                  }
                />
              </div>
              <TextField
                label="Responsavel"
                value={reconciliationForm.reconciledBy}
                onChange={(reconciledBy) =>
                  setReconciliationForm((state) => ({ ...state, reconciledBy }))
                }
              />
              <TextField
                label="Observacao se houver divergencia"
                value={reconciliationForm.notes}
                onChange={(notes) =>
                  setReconciliationForm((state) => ({ ...state, notes }))
                }
              />
              <button
                className="brand-primary-button px-4 py-2 text-sm"
                disabled={!canCloseRegister}
              >
                Conciliar
              </button>
            </form>
          </div>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
        {!canRegisterEntry ? (
          <PermissionNotice description="Voce pode consultar o fluxo financeiro, mas nao lancar entradas ou saidas." />
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Tipo
            <select
              className="brand-input px-3 py-2"
              value={form.type}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  type: event.target.value as CashEntryType,
                }))
              }
            >
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
          </label>

          <NumberField
            label="Valor"
            value={form.amount}
            onChange={(amount) => setForm((state) => ({ ...state, amount }))}
          />
        </div>

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Categoria
          <input
            className="brand-input px-3 py-2"
            value={form.category}
            onChange={(event) =>
              setForm((state) => ({ ...state, category: event.target.value }))
            }
          />
        </label>

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Descricao
          <input
            className="brand-input px-3 py-2"
            value={form.description}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                description: event.target.value,
              }))
            }
          />
        </label>

        <label className="brand-muted grid gap-1 text-sm font-medium">
          Vencimento
          <input
            className="brand-input px-3 py-2"
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm((state) => ({ ...state, dueDate: event.target.value }))
            }
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="brand-muted text-sm font-semibold">
            Pendente: R$ {summary.pendingIncome.toFixed(2)} / R${" "}
            {summary.pendingExpense.toFixed(2)}
          </p>
          <button
            className="brand-primary-button px-4 py-2 text-sm"
            disabled={!canRegisterEntry}
          >
            Lancar
          </button>
        </div>

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "settled"] as const).map((status) => (
            <button
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                selectedStatus === status
                  ? "border-[var(--brand-leaf)] bg-[#f4f9ec] text-[var(--brand-leaf)]"
                  : "border-[var(--brand-line)] text-[var(--brand-caramel)]"
              }`}
              key={status}
              onClick={() => setSelectedStatus(status)}
              type="button"
            >
              {status === "all" ? "Todos" : status === "pending" ? "Pendentes" : "Baixados"}
            </button>
          ))}
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Lancamento</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr className="border-t border-[#f1dfb5]" key={entry.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {entry.description}
                    </p>
                    <p className="brand-muted text-xs">
                      {entry.category} · venc. {entry.dueDate.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                    {entry.type === "income" ? "+" : "-"} R${" "}
                    {entry.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <Status status={entry.status} type={entry.type} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {entry.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        {canSettleEntry ? (
                          <button
                            className="text-sm font-semibold text-[var(--brand-leaf)]"
                            onClick={async () => {
                              await settleCashEntry.mutateAsync(entry.id);
                              recordAudit({
                                action: "cash_entry.settle",
                                description: `Lancamento ${entry.description} baixado`,
                                entity: "cash_entry",
                                entityId: entry.id,
                                metadata: { amount: entry.amount, type: entry.type },
                              });
                            }}
                          >
                            Baixar
                          </button>
                        ) : null}
                        {canCancelEntry ? (
                          <button
                            className="brand-muted text-sm font-semibold"
                            onClick={async () => {
                              await cancelCashEntry.mutateAsync(entry.id);
                              recordAudit({
                                action: "cash_entry.cancel",
                                description: `Lancamento ${entry.description} cancelado`,
                                entity: "cash_entry",
                                entityId: entry.id,
                                metadata: { amount: entry.amount, type: entry.type },
                              });
                            }}
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="brand-table">
            <table className="w-full text-left text-sm">
              <thead className="brand-table-header text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Movimento</th>
                  <th className="px-3 py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {cashRegisterMovements.slice(0, 6).map((movement) => (
                  <tr className="border-t border-[#f1dfb5]" key={movement.id}>
                    <td className="px-3 py-3">
                      <p className="brand-section-title font-semibold">
                        {movement.type === "supply" ? "Suprimento" : "Sangria"}
                      </p>
                      <p className="brand-muted text-xs">
                        {movement.reason} · {movement.actor}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                      {movement.type === "supply" ? "+" : "-"} R${" "}
                      {movement.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="brand-table">
            <table className="w-full text-left text-sm">
              <thead className="brand-table-header text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Conciliacao</th>
                  <th className="px-3 py-2">Diferenca</th>
                </tr>
              </thead>
              <tbody>
                {cashReconciliations.slice(0, 6).map((reconciliation) => (
                  <tr className="border-t border-[#f1dfb5]" key={reconciliation.id}>
                    <td className="px-3 py-3">
                      <p className="brand-section-title font-semibold">
                        {reconciliation.method}
                      </p>
                      <p className="brand-muted text-xs">
                        R$ {reconciliation.expectedAmount.toFixed(2)} esperado ·{" "}
                        {reconciliation.reconciledBy}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                      R$ {reconciliation.differenceAmount.toFixed(2)}
                      {reconciliation.notes ? (
                        <p className="brand-muted text-xs font-medium">
                          {reconciliation.notes}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Caixa</th>
                <th className="px-3 py-2">Esperado</th>
                <th className="px-3 py-2">Contado</th>
                <th className="px-3 py-2">Diferenca</th>
              </tr>
            </thead>
            <tbody>
              {cashRegisters.map((register) => (
                <tr className="border-t border-[#f1dfb5]" key={register.id}>
                  <td className="px-3 py-3">
                    <p className="brand-section-title font-semibold">
                      {register.status === "open" ? "Aberto" : "Fechado"}
                    </p>
                    <p className="brand-muted text-xs">
                      {register.openedBy} · {register.openedAt.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {formatOptionalCurrency(register.expectedAmount)}
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {formatOptionalCurrency(register.countedAmount)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--brand-ink)]">
                    {formatOptionalCurrency(register.differenceAmount)}
                    {register.closingNote ? (
                      <p className="brand-muted text-xs font-medium">
                        {register.closingNote}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="brand-card-warm p-3">
      <p className="brand-muted text-xs font-semibold">{label}</p>
      <p className="brand-section-title text-lg">R$ {value.toFixed(2)}</p>
    </div>
  );
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="brand-muted grid gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        min="0"
        step="0.01"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="brand-muted grid gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatOptionalCurrency(value: number | null) {
  return value === null ? "-" : `R$ ${value.toFixed(2)}`;
}

function Status({
  status,
  type,
}: {
  status: CashEntryStatus;
  type: CashEntryType;
}) {
  const label =
    status === "pending" ? "Pendente" : status === "settled" ? "Baixado" : "Cancelado";
  const tone =
    status === "settled"
      ? type === "income"
        ? "bg-[#f4f9ec] text-[var(--brand-leaf)]"
        : "bg-blue-50 text-blue-800"
      : status === "cancelled"
        ? "bg-[#f3ead7] text-[var(--brand-caramel)]"
        : "bg-[#fff4cf] text-[var(--brand-caramel)]";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>
      {label}
    </span>
  );
}
