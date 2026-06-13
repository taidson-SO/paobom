import { CustomerSection } from "@/features/customer/presentation/components/CustomerSection";
import { ProductSection } from "@/features/product/presentation/components/ProductSection";
import { SupplierSection } from "@/features/supplier/presentation/components/SupplierSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase text-green-800">
            Paobom ERP
          </p>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-normal">
                Cadastros base
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Produtos, fornecedores e clientes formam a base dos fluxos de
                compra, estoque, producao, caixa e relacionamento.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-zinc-600">
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

        <ProductSection />
        <SupplierSection />
        <CustomerSection />
      </div>
    </main>
  );
}
