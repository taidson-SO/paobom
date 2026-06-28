import { expect, Page, test } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.getByPlaceholder("usuario@paobom.local").fill(email);
  await page
    .getByPlaceholder("Sua senha")
    .fill(process.env.PLAYWRIGHT_USER_PASSWORD ?? "Paobom@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Operacao da padaria" }),
  ).toBeVisible();
}

test("exibe erro para credenciais invalidas", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("usuario@paobom.local").fill("invalido@paobom.local");
  await page.getByPlaceholder("Sua senha").fill("senha-incorreta");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Credenciais invalidas")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acesso operacional" })).toBeVisible();
});

test("restaura sessao Web e revoga acesso no logout", async ({ page }) => {
  await login(page, "dono@paobom.local");
  await expect(
    page.locator("header").getByText("Dono PaoBom", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("nav").getByRole("link", { name: "Compras" })).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Operacao da padaria" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.getByRole("heading", { name: "Acesso operacional" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Acesso operacional" })).toBeVisible();
});

test("filtra navegacao conforme permissoes do caixa", async ({ page }) => {
  await login(page, "caixa@paobom.local");

  await expect(
    page.locator("header").getByText("Caixa PaoBom", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("nav").getByRole("link", { name: "Vendas" })).toBeVisible();
  await expect(page.locator("nav").getByRole("link", { name: "Caixa" })).toBeVisible();
  await expect(page.locator("nav").getByRole("link", { name: "Compras" })).toHaveCount(0);
  await expect(page.locator("nav").getByRole("link", { name: "Estoque" })).toHaveCount(0);
});

test("executa jornadas operacionais e consulta seus resultados", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chrome",
    "Fluxo operacional completo validado no desktop; viewport mobile cobre autenticacao e navegacao.",
  );

  await login(page, "dono@paobom.local");

  const purchaseSection = page.locator("#compras");
  const purchaseForm = purchaseSection.locator("form").first();

  await purchaseSection.scrollIntoViewIfNeeded();
  await purchaseForm.getByLabel("Fornecedor").selectOption("supplier-moinho");
  await purchaseForm.getByLabel("Previsao").fill("2026-06-30");
  await purchaseForm.getByLabel("Produto").selectOption("prod-flour");
  await purchaseForm.getByLabel("Quantidade").fill("3");
  await purchaseForm.getByLabel("Custo unit.").fill("5.20");
  await purchaseForm.getByLabel("Observacoes").fill("Compra via Playwright");
  await purchaseForm.getByRole("button", { name: "Criar compra" }).click();

  const purchaseRow = purchaseSection.locator("tbody tr").first();

  await expect(
    purchaseRow.getByRole("button", { name: "Aprovar" }),
  ).toBeVisible();
  await purchaseRow.getByRole("button", { name: "Aprovar" }).click();
  await expect(
    purchaseRow.getByRole("button", { name: "Receber" }),
  ).toBeVisible();
  await purchaseRow.getByPlaceholder("Responsavel").fill("Playwright");
  await purchaseRow.getByRole("button", { name: "Receber" }).click();
  await expect(purchaseRow.getByText("Recebida", { exact: true })).toBeVisible();

  const inventorySection = page.locator("#estoque");
  const lossForm = inventorySection.locator("form").first();

  await inventorySection.scrollIntoViewIfNeeded();
  await lossForm.getByLabel("Produto").selectOption("prod-flour");
  await lossForm.getByLabel("Quantidade").fill("0.1");
  await lossForm.getByLabel("Motivo").fill("Perda via Playwright");
  await lossForm.getByRole("button", { name: "Registrar" }).click();
  await expect(
    inventorySection.getByText("Perda via Playwright"),
  ).toBeVisible();

  const productionSection = page.locator("#producao");
  const orderForm = productionSection
    .locator("form")
    .filter({ hasText: "Nova ordem" });

  await productionSection.scrollIntoViewIfNeeded();
  await orderForm.getByLabel("Ficha tecnica").selectOption("recipe-bread-v1");
  await orderForm.getByLabel("Quantidade produzida").fill("18");
  await orderForm.getByLabel("Observacoes").fill("Producao via Playwright");
  await orderForm.getByRole("button", { name: "Planejar producao" }).click();

  const productionRow = productionSection.locator("tbody").last().locator("tr").first();

  await expect(
    productionRow.getByRole("button", { name: "Iniciar" }),
  ).toBeVisible();
  await productionRow.getByRole("button", { name: "Iniciar" }).click();
  await expect(
    productionRow.getByRole("button", { name: "Finalizar" }),
  ).toBeVisible();
  await productionRow.getByRole("button", { name: "Finalizar" }).click();
  await expect(productionRow.getByText("Finalizada", { exact: true })).toBeVisible();

  const salesSection = page.locator("#vendas");
  const salesForm = salesSection.locator("form").first();
  const productSelect = salesForm.getByLabel("Produto");

  await salesSection.scrollIntoViewIfNeeded();
  await productSelect.selectOption("prod-bread");
  await salesForm.getByLabel("Quantidade").fill("2");
  await salesForm.getByLabel("Referencia do pagamento").fill("PW-PIX-001");
  await salesForm.getByLabel("Observacoes").fill("Venda via Playwright");
  await salesForm.getByRole("button", { name: "Registrar venda" }).click();
  await expect(productSelect).toHaveValue("");

  const financeSection = page.locator("#caixa");

  await financeSection.scrollIntoViewIfNeeded();
  await expect(financeSection.getByText(/Venda .* - pix/).first()).toBeVisible();

  const reportsSection = page.locator("#relatorios");

  await reportsSection.scrollIntoViewIfNeeded();
  await reportsSection.getByRole("button", { name: "Tudo" }).click();
  await expect(reportsSection.getByRole("button", { name: "CSV" })).toBeVisible();
  await expect(reportsSection.getByRole("button", { name: "JSON" })).toBeVisible();

  const auditSection = page.locator("#auditoria");

  await auditSection.scrollIntoViewIfNeeded();
  await auditSection.getByPlaceholder("sale.create").fill("sale.create");
  await expect(
    auditSection.locator("tbody").getByText("sale.create").first(),
  ).toBeVisible();
});
