"use client";

import { Permission } from "@paobom/domain";
import { useQueryClient } from "@tanstack/react-query";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiClient } from "@/core/infrastructure/api/api-client";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { PermissionGate } from "@/core/permissions/PermissionGate";
import {
  usePermissionSession,
  usePermissionSessionStore,
} from "@/core/permissions/permission-session";
import { AuthenticatedUserSummary } from "@/features/auth/presentation/components/WebAuthGate";
import { AuditSection } from "@/features/audit/presentation/components/AuditSection";
import { CustomerSection } from "@/features/customer/presentation/components/CustomerSection";
import { CustomerRelationshipSection } from "@/features/customer-relationship/presentation/components/CustomerRelationshipSection";
import { useCustomers } from "@/features/customer/presentation/hooks/useCustomers";
import { DashboardSection } from "@/features/dashboard/presentation/components/DashboardSection";
import { FinanceSection } from "@/features/finance/presentation/components/FinanceSection";
import { InventorySection } from "@/features/inventory/presentation/components/InventorySection";
import { useInventory } from "@/features/inventory/presentation/hooks/useInventory";
import { ProductSection } from "@/features/product/presentation/components/ProductSection";
import { useProducts } from "@/features/product/presentation/hooks/useProducts";
import { ProductionSection } from "@/features/production/presentation/components/ProductionSection";
import { PurchaseSection } from "@/features/purchase/presentation/components/PurchaseSection";
import { ReportsSection } from "@/features/reports/presentation/components/ReportsSection";
import { SalesSection } from "@/features/sales/presentation/components/SalesSection";
import { SupplierSection } from "@/features/supplier/presentation/components/SupplierSection";
import { useSuppliers } from "@/features/supplier/presentation/hooks/useSuppliers";
import { UserSection } from "@/features/user/presentation/components/UserSection";

type ModuleId =
  | "visao-geral"
  | "relatorios"
  | "auditoria"
  | "equipe"
  | "compras"
  | "producao"
  | "estoque"
  | "vendas"
  | "caixa"
  | "crm"
  | "produtos"
  | "fornecedores"
  | "clientes";

type ErpModule = {
  description: string;
  group: ModuleGroup;
  id: ModuleId;
  label: string;
  permission: Permission;
  render: () => ReactNode;
  title: string;
};

type ModuleGroup = "Gestao" | "Operacao" | "Atendimento" | "Cadastros";

const erpModules = [
  {
    description:
      "Indicadores e consolidacoes para acompanhar a saude do negocio.",
    group: "Gestao",
    id: "visao-geral",
    label: "Dashboard",
    permission: "dashboard:view",
    render: () => <DashboardSection />,
    title: "Gestao",
  },
  {
    description: "Analises consolidadas da operacao.",
    group: "Gestao",
    id: "relatorios",
    label: "Relatorios",
    permission: "reports:view",
    render: () => <ReportsSection />,
    title: "Relatorios",
  },
  {
    description:
      "Trilha de eventos para controle, rastreabilidade e governanca.",
    group: "Gestao",
    id: "auditoria",
    label: "Auditoria",
    permission: "audit:view",
    render: () => <AuditSection />,
    title: "Auditoria",
  },
  {
    description: "Colaboradores, perfis operacionais e permissoes efetivas.",
    group: "Gestao",
    id: "equipe",
    label: "Equipe",
    permission: "permissions:manage",
    render: () => <UserSection />,
    title: "Equipe e acessos",
  },
  {
    description:
      "Entrada de insumos, custo de compra e relacionamento com fornecedores.",
    group: "Operacao",
    id: "compras",
    label: "Compras",
    permission: "purchase:view",
    render: () => <PurchaseModule />,
    title: "Abastecimento",
  },
  {
    description: "Fichas tecnicas, ordens e custo unitario do produto fabricado.",
    group: "Operacao",
    id: "producao",
    label: "Producao",
    permission: "production:view",
    render: () => <ProductionModule />,
    title: "Producao",
  },
  {
    description: "Saldos, rastreabilidade, perdas e ajustes.",
    group: "Operacao",
    id: "estoque",
    label: "Estoque",
    permission: "inventory:view",
    render: () => <InventoryModule />,
    title: "Estoque",
  },
  {
    description: "Venda, desconto, estoque e margem por atendimento.",
    group: "Atendimento",
    id: "vendas",
    label: "Vendas",
    permission: "sales:view",
    render: () => <SalesModule />,
    title: "Vendas",
  },
  {
    description: "Lancamentos, saldo, abertura e fechamento de caixa.",
    group: "Atendimento",
    id: "caixa",
    label: "Caixa",
    permission: "finance:view",
    render: () => <FinanceSection />,
    title: "Caixa",
  },
  {
    description: "Relacionamento e acompanhamento comercial.",
    group: "Atendimento",
    id: "crm",
    label: "CRM",
    permission: "crm:view",
    render: () => <CrmModule />,
    title: "Clientes e CRM",
  },
  {
    description: "Produtos vendidos, fabricados e comprados pela padaria.",
    group: "Cadastros",
    id: "produtos",
    label: "Produtos",
    permission: "product:view",
    render: () => <ProductSection />,
    title: "Produtos",
  },
  {
    description: "Fornecedores usados no abastecimento da operacao.",
    group: "Cadastros",
    id: "fornecedores",
    label: "Fornecedores",
    permission: "supplier:view",
    render: () => <SupplierSection />,
    title: "Fornecedores",
  },
  {
    description:
      "Clientes usados em vendas, relacionamento e acompanhamento comercial.",
    group: "Cadastros",
    id: "clientes",
    label: "Clientes",
    permission: "customer:view",
    render: () => <CustomerSection />,
    title: "Clientes",
  },
] satisfies ErpModule[];

const moduleIds = new Set<ModuleId>(erpModules.map((module) => module.id));
const moduleGroups: ModuleGroup[] = [
  "Gestao",
  "Operacao",
  "Atendimento",
  "Cadastros",
];

function readModuleFromLocation(): ModuleId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const requested =
    window.location.hash.replace("#", "") ||
    params.get("module") ||
    params.get("section");

  return isModuleId(requested) ? requested : null;
}

export function ErpHome() {
  const queryClient = useQueryClient();
  const { can } = usePermissionSession();
  const clearSession = usePermissionSessionStore(
    (state) => state.clearSession,
  );
  const visibleModules = useMemo(
    () => erpModules.filter((module) => can(module.permission)),
    [can],
  );
  const firstAvailableModule = visibleModules[0];
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>(
    () => readModuleFromLocation() ?? "visao-geral",
  );
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null);
  const lastSyncedModuleRef = useRef<ModuleId | null>(null);
  const activeModule =
    visibleModules.find((module) => module.id === activeModuleId) ??
    firstAvailableModule;

  const selectModule = useCallback(
    (moduleId: ModuleId, mode: "push" | "replace" = "push") => {
      setActiveModuleId(moduleId);
      setNavigationNotice(null);
      lastSyncedModuleRef.current = moduleId;

      if (typeof window === "undefined") {
        return;
      }

      const nextUrl = `${window.location.pathname}${window.location.search}#${moduleId}`;
      if (mode === "replace") {
        window.history.replaceState(null, "", nextUrl);
        return;
      }

      window.history.pushState(null, "", nextUrl);
    },
    [],
  );

  const syncModuleFromLocation = useCallback(() => {
    const requestedModule = readModuleFromLocation();
    const fallbackModule = firstAvailableModule?.id;
    const requestedIsAllowed = visibleModules.some(
      (module) => module.id === requestedModule,
    );
    const nextModule =
      requestedModule && requestedIsAllowed ? requestedModule : fallbackModule;

    if (!nextModule || typeof window === "undefined") {
      return;
    }

    if (lastSyncedModuleRef.current !== nextModule) {
      setActiveModuleId(nextModule);
      lastSyncedModuleRef.current = nextModule;
    }

    if (requestedModule && !requestedIsAllowed) {
      setNavigationNotice(
        "Seu usuario nao tem permissao para esse modulo. Abrimos o primeiro modulo disponivel.",
      );
    } else {
      setNavigationNotice(null);
    }

    if (window.location.hash !== `#${nextModule}`) {
      const nextUrl = `${window.location.pathname}${window.location.search}#${nextModule}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, [firstAvailableModule?.id, visibleModules]);

  useEffect(() => {
    function handleLocationChange() {
      syncModuleFromLocation();
    }

    const initialSync = window.setTimeout(handleLocationChange, 0);

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [syncModuleFromLocation]);

  useEffect(() => {
    if (activeModule) {
      lastSyncedModuleRef.current = activeModule.id;
    }
  }, [activeModule]);

  async function logout() {
    try {
      await container.get<ApiClient>(TOKENS.apiClient).logout();
    } finally {
      queryClient.clear();
      clearSession();
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--brand-cream-soft)]">
      <header className="brand-divider border-b bg-[linear-gradient(135deg,#fff7dc_0%,#fffaf0_58%,#f3ddb2_100%)]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-5 lg:px-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-md border border-[var(--brand-gold)] bg-[var(--brand-brown)] text-lg font-black text-[var(--brand-cream)] shadow-sm">
                PB
              </div>
              <div>
                <p className="brand-kicker text-sm uppercase">
                  Panificadora PaoBom
                </p>
                <h1 className="brand-section-title mt-1 text-3xl tracking-normal">
                  Operacao da padaria
                </h1>
              </div>
            </div>
            <div className="grid gap-3 md:justify-items-end">
              <div className="flex items-center gap-3">
                <AuthenticatedUserSummary />
                <button
                  className="brand-secondary-button h-9 px-3 text-sm"
                  onClick={() => void logout()}
                  type="button"
                >
                  Sair
                </button>
              </div>
              <div className="brand-muted grid grid-cols-3 gap-2 text-xs font-semibold md:grid-cols-6">
                <OperationalStep label="Compra" step="01" />
                <OperationalStep label="Estoque" step="02" />
                <OperationalStep label="Receita" step="03" />
                <OperationalStep label="Producao" step="04" />
                <OperationalStep label="Venda" step="05" />
                <OperationalStep label="Caixa" step="06" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
        <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <nav
            aria-label="Navegacao principal"
            className="brand-sidebar brand-divider overflow-x-auto border-b pb-3 lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4"
          >
            <div className="grid gap-4 lg:gap-5">
              {moduleGroups.map((group) => {
                const groupModules = visibleModules.filter(
                  (module) => module.group === group,
                );

                if (groupModules.length === 0) {
                  return null;
                }

                return (
                  <div className="grid gap-2" key={group}>
                    <p className="brand-muted text-xs font-bold uppercase">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:grid">
                      {groupModules.map((module) => {
                        const isActive = module.id === activeModule?.id;

                        return (
                          <a
                            aria-current={isActive ? "page" : undefined}
                            className="brand-nav-item"
                            data-active={isActive ? "true" : "false"}
                            href={`#${module.id}`}
                            key={module.id}
                            onClick={(event) => {
                              event.preventDefault();
                              selectModule(module.id);
                            }}
                          >
                            <span>{module.label}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="grid min-w-0 gap-8">
          {navigationNotice ? (
            <div
              className="brand-card border-[var(--brand-gold)] bg-[var(--brand-cream)] p-4 text-sm font-semibold text-[var(--brand-brown)]"
              role="status"
            >
              {navigationNotice}
            </div>
          ) : null}
          {activeModule ? (
            <WorkspaceModule module={activeModule} />
          ) : (
            <section className="brand-card p-5">
              <h2 className="brand-section-title text-lg">
                Nenhum modulo disponivel
              </h2>
              <p className="brand-muted mt-1 text-sm leading-6">
                Seu usuario nao possui permissoes para acessar os modulos do
                ERP.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function OperationalStep({ label, step }: { label: string; step: string }) {
  return (
    <div className="brand-divider flex items-center gap-2 border-l pl-3">
      <span className="text-[11px] font-bold text-[var(--brand-leaf)]">
        {step}
      </span>
      <span>{label}</span>
    </div>
  );
}

function WorkspaceModule({ module }: { module: ErpModule }) {
  return (
    <PermissionGate permission={module.permission}>
      <section className="min-w-0 scroll-mt-5" id={module.id}>
        <div className="brand-divider mb-3 border-b pb-2">
          <p className="brand-kicker text-xs uppercase">{module.group}</p>
          <h2 className="brand-section-title mt-1 text-xl">{module.title}</h2>
          <p className="brand-muted mt-1 text-sm leading-6">
            {module.description}
          </p>
        </div>
        <div className="grid min-w-0 gap-4">{module.render()}</div>
      </section>
    </PermissionGate>
  );
}

function PurchaseModule() {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();

  return <PurchaseSection products={products} suppliers={suppliers} />;
}

function ProductionModule() {
  const { products } = useProducts();

  return <ProductionSection products={products} />;
}

function InventoryModule() {
  const { products } = useProducts();

  return <InventorySection products={products} />;
}

function SalesModule() {
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { balances } = useInventory();

  return (
    <SalesSection
      customers={customers}
      inventoryBalances={balances}
      products={products}
    />
  );
}

function CrmModule() {
  const { customers } = useCustomers();

  return <CustomerRelationshipSection customers={customers} />;
}

function isModuleId(value: string | null): value is ModuleId {
  return value !== null && moduleIds.has(value as ModuleId);
}
