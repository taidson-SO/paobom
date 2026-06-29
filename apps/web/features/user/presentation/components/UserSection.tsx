"use client";

import { getRolePermissions, Permission, UserRole } from "@paobom/domain";
import { FormEvent, useMemo, useState } from "react";

import { PermissionNotice } from "@/core/permissions/PermissionGate";
import {
  getRoleLabel,
  usePermissionSession,
} from "@/core/permissions/permission-session";
import { ManagedUser } from "@/features/user/data/mappers/UserMapper";
import { useUsers } from "@/features/user/presentation/hooks/useUsers";
import {
  CreateUserSchema,
  ResetUserPasswordSchema,
  UpdateUserSchema,
} from "@/features/user/schemas/UserSchema";

type UserFormState = {
  active: boolean;
  email: string;
  name: string;
  password: string;
  role: UserRole;
};

const initialForm: UserFormState = {
  active: true,
  email: "",
  name: "",
  password: "",
  role: "viewer",
};

const roleOptions: UserRole[] = [
  "owner",
  "manager",
  "cashier",
  "baker",
  "stock",
  "sales",
  "viewer",
];

const permissionLabels: Record<Permission, string> = {
  "audit:view": "Consultar auditoria",
  "crm:manage": "Gerenciar CRM",
  "crm:view": "Consultar CRM",
  "customer:manage": "Gerenciar clientes",
  "customer:view": "Consultar clientes",
  "dashboard:view": "Consultar dashboard",
  "finance:cancel": "Cancelar financeiro",
  "finance:close-register": "Fechar caixa",
  "finance:open-register": "Abrir caixa",
  "finance:register-entry": "Registrar caixa",
  "finance:settle": "Baixar financeiro",
  "finance:view": "Consultar financeiro",
  "inventory:adjust": "Ajustar estoque",
  "inventory:register-loss": "Registrar perda",
  "inventory:view": "Consultar estoque",
  "permissions:manage": "Gerenciar equipe",
  "product:manage": "Gerenciar produtos",
  "product:view": "Consultar produtos",
  "production:cancel": "Cancelar producao",
  "production:manage-order": "Gerenciar ordens",
  "production:manage-recipe": "Gerenciar receitas",
  "production:view": "Consultar producao",
  "purchase:cancel": "Cancelar compras",
  "purchase:create": "Criar compras",
  "purchase:receive": "Receber compras",
  "purchase:view": "Consultar compras",
  "reports:view": "Consultar relatorios",
  "sales:authorize-discount": "Autorizar desconto",
  "sales:authorize-oversell": "Autorizar venda sem estoque",
  "sales:cancel": "Cancelar vendas",
  "sales:create": "Criar vendas",
  "sales:pay": "Receber vendas",
  "sales:view": "Consultar vendas",
  "supplier:manage": "Gerenciar fornecedores",
  "supplier:view": "Consultar fornecedores",
};

const permissionGroups = [
  {
    label: "Gestao",
    permissions: [
      "dashboard:view",
      "reports:view",
      "audit:view",
      "permissions:manage",
    ],
  },
  {
    label: "Cadastros",
    permissions: [
      "product:view",
      "product:manage",
      "supplier:view",
      "supplier:manage",
      "customer:view",
      "customer:manage",
      "crm:view",
      "crm:manage",
    ],
  },
  {
    label: "Operacao",
    permissions: [
      "purchase:view",
      "purchase:create",
      "purchase:receive",
      "purchase:cancel",
      "inventory:view",
      "inventory:adjust",
      "inventory:register-loss",
      "production:view",
      "production:manage-recipe",
      "production:manage-order",
      "production:cancel",
    ],
  },
  {
    label: "Atendimento e caixa",
    permissions: [
      "sales:view",
      "sales:create",
      "sales:pay",
      "sales:cancel",
      "sales:authorize-discount",
      "sales:authorize-oversell",
      "finance:view",
      "finance:register-entry",
      "finance:settle",
      "finance:cancel",
      "finance:open-register",
      "finance:close-register",
    ],
  },
] satisfies Array<{ label: string; permissions: Permission[] }>;

export function UserSection() {
  const {
    createUser,
    deactivateUser,
    isLoading,
    selectedUserId,
    setSelectedUser,
    updateUser,
    users,
  } = useUsers();
  const { can } = usePermissionSession();
  const canManageUsers = can("permissions:manage");
  const [form, setForm] = useState<UserFormState>(initialForm);
  const [confirmationUserId, setConfirmationUserId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageUsers) {
      setError(
        "Acao bloqueada: seu perfil nao possui permissao para gerenciar colaboradores.",
      );
      return;
    }

    setError(null);
    setNotice(null);

    try {
      if (selectedUser) {
        const parsed = UpdateUserSchema.parse(form);
        await updateUser.mutateAsync({
          id: selectedUser.id,
          input: {
            active: parsed.active,
            email: parsed.email,
            name: parsed.name,
            role: parsed.role,
          },
        });
        setNotice("Dados do colaborador atualizados.");
      } else {
        const parsed = CreateUserSchema.parse(form);
        await createUser.mutateAsync(parsed);
        setNotice("Colaborador criado com acesso ativo.");
        clearForm();
      }
    } catch (cause) {
      setError(
        getUserActionError(cause, "Nao foi possivel salvar colaborador."),
      );
    }
  }

  function clearForm() {
    setSelectedUser(null);
    setForm(initialForm);
    setConfirmationUserId(null);
    setResetPassword("");
  }

  function editUser(user: ManagedUser) {
    setSelectedUser(user.id);
    setForm({
      active: user.active,
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
    });
    setConfirmationUserId(null);
    setError(null);
    setNotice(null);
    setResetPassword("");
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) {
      return;
    }

    if (!canManageUsers) {
      setError(
        "Acao bloqueada: seu perfil nao possui permissao para resetar senhas.",
      );
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const parsed = ResetUserPasswordSchema.parse({
        password: resetPassword,
      });
      await updateUser.mutateAsync({
        id: selectedUser.id,
        input: { password: parsed.password },
      });
      setResetPassword("");
      setNotice(
        `Senha de ${selectedUser.name} redefinida. As sessoes abertas foram revogadas.`,
      );
    } catch (cause) {
      setError(getUserActionError(cause, "Nao foi possivel resetar a senha."));
    }
  }

  async function deactivateConfirmed(user: ManagedUser) {
    try {
      setError(null);
      setNotice(null);
      await deactivateUser.mutateAsync(user.id);
      setConfirmationUserId(null);
      setNotice(
        `${user.name} foi desativado. As sessoes abertas foram revogadas.`,
      );
      if (selectedUserId === user.id) {
        clearForm();
      }
    } catch (cause) {
      setError(
        getUserActionError(cause, "Nao foi possivel desativar colaborador."),
      );
    }
  }

  async function reactivateUser(user: ManagedUser) {
    try {
      setError(null);
      setNotice(null);
      await updateUser.mutateAsync({
        id: user.id,
        input: { active: true },
      });
      setNotice(`${user.name} foi reativado.`);
    } catch (cause) {
      setError(
        getUserActionError(cause, "Nao foi possivel reativar colaborador."),
      );
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="brand-card grid gap-3 p-4">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div>
            <p className="brand-kicker text-sm">Equipe</p>
            <h2 className="brand-section-title text-xl">
              {selectedUser ? "Editar colaborador" : "Novo colaborador"}
            </h2>
          </div>
          {!canManageUsers ? (
            <PermissionNotice description="Voce pode consultar seu acesso, mas nao criar ou alterar colaboradores." />
          ) : null}

          <Field
            label="Nome"
            value={form.name}
            onChange={(name) => setForm((state) => ({ ...state, name }))}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(email) => setForm((state) => ({ ...state, email }))}
          />
          <label className="brand-muted grid gap-1 text-sm font-medium">
            Perfil
            <select
              className="brand-input px-3 py-2"
              value={form.role}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  role: event.target.value as UserRole,
                }))
              }
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>
          {!selectedUser ? (
            <Field
              label="Senha inicial"
              type="password"
              value={form.password}
              onChange={(password) =>
                setForm((state) => ({ ...state, password }))
              }
            />
          ) : null}
          {selectedUser ? (
            <div className="rounded-md border border-[var(--brand-line)] bg-white/70 p-3">
              <label className="brand-muted flex items-center gap-2 text-sm font-medium">
                <input
                  checked={form.active}
                  className="size-4 accent-[var(--brand-leaf)]"
                  type="checkbox"
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      active: event.target.checked,
                    }))
                  }
                />
                Usuario ativo
              </label>
              <p className="brand-muted mt-1 text-xs leading-5">
                Usuarios inativos nao conseguem entrar no ERP e suas sessoes
                abertas sao revogadas pelo backend.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              className="brand-primary-button px-4 py-2 text-sm"
              disabled={
                !canManageUsers || createUser.isPending || updateUser.isPending
              }
            >
              {selectedUser ? "Salvar" : "Criar"}
            </button>
            {selectedUser ? (
              <button
                className="brand-secondary-button px-4 py-2 text-sm"
                type="button"
                onClick={clearForm}
              >
                Limpar
              </button>
            ) : null}
          </div>
        </form>
        <ActionMessage message={error} tone="error" />
        <ActionMessage message={notice} tone="success" />
        {selectedUser ? (
          <form
            className="brand-divider grid gap-2 border-t pt-3"
            onSubmit={handlePasswordReset}
          >
            <div>
              <p className="brand-kicker text-xs uppercase">Reset de senha</p>
              <p className="brand-muted mt-1 text-xs leading-5">
                Define uma nova senha temporaria e revoga sessoes abertas do
                colaborador.
              </p>
            </div>
            <Field
              label="Nova senha temporaria"
              type="password"
              value={resetPassword}
              onChange={setResetPassword}
            />
            <button
              className="brand-secondary-button px-4 py-2 text-sm"
              disabled={!canManageUsers || updateUser.isPending}
              type="submit"
            >
              Resetar senha
            </button>
          </form>
        ) : null}

        <RolePermissionSummary role={form.role} />
      </div>

      <div className="brand-card min-w-0 p-4">
        <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <p className="brand-kicker text-sm">Colaboradores</p>
            <h2 className="brand-section-title text-xl">
              Acessos operacionais
            </h2>
          </div>
          <p className="brand-muted text-sm">
            {users.length} colaborador{users.length === 1 ? "" : "es"}
          </p>
        </div>

        <div className="brand-table">
          <table className="w-full text-left text-sm">
            <thead className="brand-table-header text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Colaborador</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Status</th>
                {canManageUsers ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="brand-muted px-3 py-4" colSpan={4}>
                    Carregando colaboradores...
                  </td>
                </tr>
              ) : null}
              {users.map((user) => (
                <tr
                  className={`border-t border-[#f1dfb5] ${
                    user.active ? "bg-white" : "bg-red-50/40"
                  }`}
                  key={user.id}
                >
                  <td className="px-3 py-3">
                    <p
                      className={`brand-section-title font-semibold ${
                        user.active ? "" : "opacity-70"
                      }`}
                    >
                      {user.name}
                    </p>
                    <p className="brand-muted text-xs">
                      {user.email}
                      {!user.active ? " - acesso bloqueado" : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--brand-brown)]">
                    {getRoleLabel(user.role)}
                  </td>
                  <td className="px-3 py-3">
                    <Status active={user.active} />
                  </td>
                  {canManageUsers ? (
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          className="brand-secondary-button px-3 py-1.5 text-xs"
                          type="button"
                          onClick={() => editUser(user)}
                        >
                          Editar
                        </button>
                        {user.active && confirmationUserId !== user.id ? (
                          <button
                            className="brand-danger-button px-3 py-1.5 text-xs"
                            disabled={deactivateUser.isPending}
                            type="button"
                            onClick={() => setConfirmationUserId(user.id)}
                          >
                            Desativar
                          </button>
                        ) : null}
                        {user.active && confirmationUserId === user.id ? (
                          <div className="flex flex-wrap justify-end gap-2 rounded-md border border-red-200 bg-red-50 p-2">
                            <span className="basis-full text-xs font-semibold text-red-800">
                              Confirmar desativacao?
                            </span>
                            <button
                              className="brand-danger-button px-3 py-1.5 text-xs"
                              disabled={deactivateUser.isPending}
                              type="button"
                              onClick={() => void deactivateConfirmed(user)}
                            >
                              Confirmar
                            </button>
                            <button
                              className="brand-secondary-button px-3 py-1.5 text-xs"
                              type="button"
                              onClick={() => setConfirmationUserId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : null}
                        {!user.active ? (
                          <button
                            className="brand-secondary-button px-3 py-1.5 text-xs"
                            disabled={updateUser.isPending}
                            type="button"
                            onClick={() => void reactivateUser(user)}
                          >
                            Reativar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function RolePermissionSummary({ role }: { role: UserRole }) {
  const permissions = new Set(getRolePermissions(role));

  return (
    <div className="brand-divider border-t pt-3">
      <p className="brand-kicker text-xs uppercase">Permissoes efetivas</p>
      <div className="mt-2 grid gap-3">
        {permissionGroups.map((group) => {
          const allowed = group.permissions.filter((permission) =>
            permissions.has(permission),
          );

          if (allowed.length === 0) {
            return null;
          }

          return (
            <div key={group.label}>
              <p className="brand-section-title text-sm">{group.label}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {allowed.map((permission) => (
                  <span
                    className="rounded-sm border border-[var(--brand-gold)] bg-[var(--brand-cream)] px-2 py-1 text-xs font-semibold text-[var(--brand-brown)]"
                    key={permission}
                  >
                    {permissionLabels[permission]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="brand-muted grid gap-1 text-sm font-medium">
      {label}
      <input
        className="brand-input px-3 py-2"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-bold ${
        active
          ? "bg-[var(--brand-leaf-soft)] text-[var(--brand-leaf)]"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          active ? "bg-[var(--brand-leaf)]" : "bg-red-600"
        }`}
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function ActionMessage({
  message,
  tone,
}: {
  message: string | null;
  tone: "error" | "success";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-[var(--brand-line)] bg-[var(--brand-leaf-soft)] text-[var(--brand-leaf)]"
      }`}
      role="status"
    >
      {message}
    </p>
  );
}

function getUserActionError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message : fallback;

  if (message.includes("ultimo administrador")) {
    return `${message}. Crie ou promova outro administrador antes de continuar.`;
  }

  if (message.includes("403") || message.includes("permiss")) {
    return "Acao bloqueada: seu perfil nao possui permissao para gerenciar colaboradores.";
  }

  return message || fallback;
}
