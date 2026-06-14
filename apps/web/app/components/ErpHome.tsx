"use client";

import { CustomerSection } from "@/features/customer/presentation/components/CustomerSection";
import { CustomerRelationshipSection } from "@/features/customer-relationship/presentation/components/CustomerRelationshipSection";
import { useCustomers } from "@/features/customer/presentation/hooks/useCustomers";
import { DashboardSection } from "@/features/dashboard/presentation/components/DashboardSection";
import { FinanceSection } from "@/features/finance/presentation/components/FinanceSection";
import { InventorySection } from "@/features/inventory/presentation/components/InventorySection";
import { ProductSection } from "@/features/product/presentation/components/ProductSection";
import { useProducts } from "@/features/product/presentation/hooks/useProducts";
import { ProductionSection } from "@/features/production/presentation/components/ProductionSection";
import { PurchaseSection } from "@/features/purchase/presentation/components/PurchaseSection";
import { ReportsSection } from "@/features/reports/presentation/components/ReportsSection";
import { SalesSection } from "@/features/sales/presentation/components/SalesSection";
import { SupplierSection } from "@/features/supplier/presentation/components/SupplierSection";
import { useSuppliers } from "@/features/supplier/presentation/hooks/useSuppliers";

export function ErpHome() {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { customers } = useCustomers();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-bold uppercase text-green-800">
          Paobom ERP
        </p>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">
              Operacao da padaria
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Compras, produtos, fornecedores e clientes formam a base dos
              fluxos de estoque, producao, caixa e relacionamento.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold text-zinc-600 md:grid-cols-11">
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Dashboard
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Relatorios
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Compras
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Producao
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Estoque
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Vendas
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Caixa
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Produtos
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Fornecedores
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Clientes
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              CRM
            </span>
          </div>
        </div>
      </header>

      <DashboardSection />
      <ReportsSection />
      <PurchaseSection products={products} suppliers={suppliers} />
      <ProductionSection products={products} />
      <InventorySection products={products} />
      <SalesSection customers={customers} products={products} />
      <FinanceSection />
      <CustomerRelationshipSection customers={customers} />
      <ProductSection />
      <SupplierSection />
      <CustomerSection />
    </div>
  );
}
