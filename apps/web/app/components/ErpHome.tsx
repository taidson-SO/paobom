"use client";

import { Permission } from "@paobom/domain";
import { ReactNode } from "react";

import { PermissionGate } from "@/core/permissions/PermissionGate";
import {
  getRoleLabel,
  usePermissionSession,
} from "@/core/permissions/permission-session";
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

const navigationGroups = [
  {
    items: [
      { href: "#visao-geral", label: "Dashboard", permission: "dashboard:view" },
      { href: "#relatorios", label: "Relatorios", permission: "reports:view" },
      { href: "#auditoria", label: "Auditoria", permission: "audit:view" },
    ],
    label: "Gestao",
  },
  {
    items: [
      { href: "#compras", label: "Compras", permission: "purchase:view" },
      { href: "#producao", label: "Producao", permission: "production:view" },
      { href: "#estoque", label: "Estoque", permission: "inventory:view" },
    ],
    label: "Operacao",
  },
  {
    items: [
      { href: "#vendas", label: "Vendas", permission: "sales:view" },
      { href: "#caixa", label: "Caixa", permission: "finance:view" },
      { href: "#crm", label: "CRM", permission: "crm:view" },
    ],
    label: "Atendimento",
  },
  {
    items: [
      { href: "#produtos", label: "Produtos", permission: "product:view" },
      { href: "#fornecedores", label: "Fornecedores", permission: "supplier:view" },
      { href: "#clientes", label: "Clientes", permission: "customer:view" },
    ],
    label: "Cadastros",
  },
] satisfies {
  items: { href: string; label: string; permission: Permission }[];
  label: string;
}[];

export function ErpHome() {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { customers } = useCustomers();
  const { balances } = useInventory();
  const { can, currentUser, setCurrentUser, users } = usePermissionSession();
  const visibleNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-5 lg:px-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-green-800">
                Paobom ERP
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-zinc-950">
                Operacao da padaria
              </h1>
            </div>
            <div className="grid gap-3 md:justify-items-end">
              <label className="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                Perfil operacional
                <select
                  className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold normal-case text-zinc-800"
                  onChange={(event) => setCurrentUser(event.target.value)}
                  value={currentUser.id}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {getRoleLabel(user.role)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-zinc-600 md:grid-cols-6">
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

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[240px_1fr] lg:px-6">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <nav className="overflow-x-auto border-b border-zinc-200 pb-3 lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <div className="flex min-w-max gap-5 lg:min-w-0 lg:flex-col lg:gap-6">
              {visibleNavigationGroups.map((group) => (
                <div className="grid gap-2" key={group.label}>
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    {group.label}
                  </p>
                  <div className="flex gap-2 lg:grid">
                    {group.items.map((item) => (
                      <a
                        className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-white hover:text-green-800"
                        href={item.href}
                        key={item.href}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <main className="grid gap-8">
          <WorkspaceGroup
            description="Indicadores e consolidacoes para acompanhar a saude do negocio."
            id="visao-geral"
            permission="dashboard:view"
            title="Gestao"
          >
            <DashboardSection />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Analises consolidadas da operacao."
            id="relatorios"
            permission="reports:view"
            title="Relatorios"
          >
            <ReportsSection />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Trilha de eventos para controle, rastreabilidade e governanca."
            id="auditoria"
            permission="audit:view"
            title="Auditoria"
          >
            <AuditSection />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Entrada de insumos, custo de compra e relacionamento com fornecedores."
            id="compras"
            permission="purchase:view"
            title="Abastecimento"
          >
            <PurchaseSection products={products} suppliers={suppliers} />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Fichas tecnicas, ordens e custo unitario do produto fabricado."
            id="producao"
            permission="production:view"
            title="Producao"
          >
            <ProductionSection products={products} />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Saldos, rastreabilidade, perdas e ajustes."
            id="estoque"
            permission="inventory:view"
            title="Estoque"
          >
            <InventorySection products={products} />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Venda, desconto, estoque e margem por atendimento."
            id="vendas"
            permission="sales:view"
            title="Vendas"
          >
            <SalesSection
              customers={customers}
              inventoryBalances={balances}
              products={products}
            />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Lancamentos, saldo, abertura e fechamento de caixa."
            id="caixa"
            permission="finance:view"
            title="Caixa"
          >
            <FinanceSection />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Relacionamento e acompanhamento comercial."
            id="crm"
            permission="crm:view"
            title="Clientes e CRM"
          >
            <CustomerRelationshipSection customers={customers} />
          </WorkspaceGroup>

          <WorkspaceGroup
            description="Base operacional usada por compras, receitas, vendas e relatorios."
            id="produtos"
            permission="product:view"
            title="Cadastros"
          >
            <PermissionGate permission="product:view">
              <ProductSection />
            </PermissionGate>
            <PermissionGate permission="supplier:view">
              <SupplierSection />
            </PermissionGate>
            <PermissionGate permission="customer:view">
              <CustomerSection />
            </PermissionGate>
          </WorkspaceGroup>
        </main>
      </div>
    </div>
  );
}

function OperationalStep({ label, step }: { label: string; step: string }) {
  return (
    <div className="flex items-center gap-2 border-l border-zinc-200 pl-3">
      <span className="text-[11px] font-bold text-green-800">{step}</span>
      <span>{label}</span>
    </div>
  );
}

function WorkspaceGroup({
  children,
  description,
  id,
  permission,
  title,
}: {
  children: ReactNode;
  description: string;
  id: string;
  permission: Permission;
  title: string;
}) {
  return (
    <PermissionGate permission={permission}>
      <section className="scroll-mt-5" id={id}>
        <div className="mb-3 border-b border-zinc-200 pb-2">
          <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        <div className="grid gap-4">{children}</div>
      </section>
    </PermissionGate>
  );
}
