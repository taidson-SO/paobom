import { expect, Page, test } from "@playwright/test";

const visualPassword = process.env.PLAYWRIGHT_USER_PASSWORD;
const desktopModules = [
  { id: "visao-geral", label: "Dashboard" },
  { id: "relatorios", label: "Relatorios" },
  { id: "auditoria", label: "Auditoria" },
  { id: "compras", label: "Compras" },
  { id: "producao", label: "Producao" },
  { id: "estoque", label: "Estoque" },
  { id: "vendas", label: "Vendas" },
  { id: "caixa", label: "Caixa" },
  { id: "crm", label: "CRM" },
  { id: "produtos", label: "Produtos" },
];
const mobileModules = [
  { id: "visao-geral", label: "Dashboard" },
  { id: "compras", label: "Compras" },
  { id: "vendas", label: "Vendas" },
  { id: "produtos", label: "Produtos" },
];

test.skip(
  !visualPassword,
  "Defina PLAYWRIGHT_USER_PASSWORD para validar layout autenticado.",
);

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    overflow.scrollWidth,
    `Horizontal overflow: ${JSON.stringify(overflow)}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

async function login(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("usuario@paobom.local").fill("dono@paobom.local");
  await page.getByPlaceholder("Sua senha").fill(visualPassword ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Operacao da padaria" }),
  ).toBeVisible();
}

async function openModule(page: Page, item: { id: string; label: string }) {
  await page.getByRole("link", { name: item.label }).click();
  await expect(page.locator(`#${item.id}`)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
}

test("login publico nao cria overflow horizontal", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Acesso operacional" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: `test-results/visual-login-${testInfo.project.name}.png`,
  });
});

test("desktop autenticado renderiza secoes principais sem overflow", async ({
  page,
}, testInfo) => {
  await login(page);
  await expectNoHorizontalOverflow(page);

  for (const item of desktopModules) {
    await openModule(page, item);
    await expectNoHorizontalOverflow(page);
  }

  await page.screenshot({
    fullPage: true,
    path: `test-results/visual-desktop-full-${testInfo.project.name}.png`,
  });
});

test("mobile autenticado mantem layout dentro da viewport", async (
  { page },
  testInfo,
) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expectNoHorizontalOverflow(page);

  for (const item of mobileModules) {
    await openModule(page, item);
    await expectNoHorizontalOverflow(page);
  }

  await page.screenshot({
    fullPage: true,
    path: `test-results/visual-mobile-full-${testInfo.project.name}.png`,
  });
});
