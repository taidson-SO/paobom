"use client";

import { CustomerSection } from "@/features/customer/presentation/components/CustomerSection";
import { ProductSection } from "@/features/product/presentation/components/ProductSection";
import { useProducts } from "@/features/product/presentation/hooks/useProducts";
import { PurchaseSection } from "@/features/purchase/presentation/components/PurchaseSection";
import { SupplierSection } from "@/features/supplier/presentation/components/SupplierSection";
import { useSuppliers } from "@/features/supplier/presentation/hooks/useSuppliers";

export function ErpHome() {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();

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
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-zinc-600">
            <span className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              Compras
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
          </div>
        </div>
      </header>

      <PurchaseSection products={products} suppliers={suppliers} />
      <ProductSection />
      <SupplierSection />
      <CustomerSection />
    </div>
  );
}
