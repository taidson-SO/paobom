import { expect, Locator, Page, test } from "@playwright/test";

const allPermissions = [
  "dashboard:view",
  "reports:view",
  "audit:view",
  "purchase:view",
  "purchase:manage",
  "production:view",
  "production:manage-recipe",
  "production:manage-order",
  "production:cancel",
  "inventory:view",
  "inventory:manage",
  "sales:view",
  "sales:manage",
  "finance:view",
  "finance:manage",
  "crm:view",
  "crm:manage",
  "product:view",
  "product:manage",
  "supplier:view",
  "supplier:manage",
  "customer:view",
  "customer:manage",
];

const modulesWithForms = [
  { id: "compras", label: "Compras" },
  { id: "producao", label: "Producao" },
  { id: "estoque", label: "Estoque" },
  { id: "vendas", label: "Vendas" },
  { id: "caixa", label: "Caixa" },
  { id: "crm", label: "CRM" },
  { id: "produtos", label: "Produtos" },
  { id: "fornecedores", label: "Fornecedores" },
  { id: "clientes", label: "Clientes" },
];

const sampleProducts = [
  {
    active: true,
    category: "Padaria artesanal",
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "prod-bread",
    kind: "finished_product",
    minimumStock: 12,
    name: "Pao frances tradicional",
    purchasePrice: 0.8,
    salePrice: 1.2,
    sku: "PAO-FRANCES",
    unit: "unit",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    active: true,
    category: "Insumos",
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "prod-flour",
    kind: "raw_material",
    minimumStock: 20,
    name: "Farinha de trigo",
    purchasePrice: 4.5,
    salePrice: 0,
    sku: "FARINHA",
    unit: "kg",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const sampleSuppliers = [
  {
    active: true,
    contactName: "Ana",
    createdAt: "2026-01-01T00:00:00.000Z",
    document: "00.000.000/0001-00",
    email: "fornecedor@paobom.local",
    id: "supplier-1",
    name: "Moinho Bom Trigo",
    phone: "(81) 3000-0000",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const sampleCustomers = [
  {
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    document: "000.000.000-00",
    email: "cliente@paobom.local",
    id: "customer-1",
    interactions: [],
    name: "Cliente Balcao",
    notes: "Cliente recorrente",
    phone: "(81) 90000-0000",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const emptyListEndpoints = [
  "/audit-logs",
  "/cash-entries",
  "/cash-register-movements",
  "/cash-registers",
  "/inventory/balances",
  "/inventory/counts",
  "/inventory/lots",
  "/inventory/movements",
  "/production/orders",
  "/production/recipes",
  "/purchases",
  "/reports",
  "/sales",
];

async function mockApi(page: Page) {
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "OPTIONS") {
      return route.fulfill({ headers: corsHeaders(), status: 204 });
    }

    if (!url.origin.includes("localhost:3333")) {
      return route.fallback();
    }

    if (url.pathname === "/auth/me") {
      return route.fulfill({
        headers: corsHeaders(),
        json: {
          data: {
            email: "dono@paobom.local",
            id: "user-owner",
            name: "Dono PaoBom",
            permissions: allPermissions,
            role: "owner",
          },
        },
      });
    }

    if (url.pathname === "/products") {
      return route.fulfill({ headers: corsHeaders(), json: { data: sampleProducts } });
    }

    if (url.pathname === "/suppliers") {
      return route.fulfill({ headers: corsHeaders(), json: { data: sampleSuppliers } });
    }

    if (url.pathname === "/customers") {
      return route.fulfill({ headers: corsHeaders(), json: { data: sampleCustomers } });
    }

    if (emptyListEndpoints.includes(url.pathname)) {
      return route.fulfill({ headers: corsHeaders(), json: { data: [] } });
    }

    return route.fulfill({ headers: corsHeaders(), json: { data: [] } });
  });
}

function corsHeaders() {
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-origin": "http://localhost:3000",
  };
}

async function openModule(page: Page, item: { id: string; label: string }) {
  await page.goto(`/#${item.id}`);
  await expect(page.locator(`#${item.id}`)).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    overflow.scrollWidth,
    `Horizontal overflow: ${JSON.stringify(overflow)}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

async function expectFormControlsDoNotOverlap(form: Locator) {
  const boxes = await form
    .locator("input:visible, select:visible, textarea:visible, button:visible")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const label =
          element.getAttribute("aria-label") ??
          element.textContent?.trim() ??
          element.getAttribute("name") ??
          element.tagName.toLowerCase();

        return {
          bottom: rect.bottom,
          height: rect.height,
          label,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width,
        };
      }),
    );

  for (let index = 0; index < boxes.length; index += 1) {
    const current = boxes[index];

    if (current.width === 0 || current.height === 0) {
      continue;
    }

    for (const next of boxes.slice(index + 1)) {
      if (next.width === 0 || next.height === 0) {
        continue;
      }

      const overlaps =
        current.left < next.right - 1 &&
        current.right > next.left + 1 &&
        current.top < next.bottom - 1 &&
        current.bottom > next.top + 1;

      expect(overlaps, JSON.stringify({ current, next })).toBe(false);
    }
  }
}

test("formularios nao criam overflow nem sobreposicao no desktop", async ({
  page,
}, testInfo) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Operacao da padaria" })).toBeVisible();

  for (const item of modulesWithForms) {
    await openModule(page, item);
    await expectNoHorizontalOverflow(page);

    const forms = page.locator(`#${item.id} form`);
    const count = await forms.count();
    expect(count, `Modulo ${item.id} deveria ter formulario`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      await expectFormControlsDoNotOverlap(forms.nth(index));
    }
  }

  await page.screenshot({
    fullPage: true,
    path: `test-results/forms-layout-desktop-${testInfo.project.name}.png`,
  });
});

test("formularios nao criam overflow nem sobreposicao no mobile", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Operacao da padaria" })).toBeVisible();

  for (const item of modulesWithForms) {
    await openModule(page, item);
    await expectNoHorizontalOverflow(page);

    const forms = page.locator(`#${item.id} form`);
    const count = await forms.count();
    expect(count, `Modulo ${item.id} deveria ter formulario`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      await expectFormControlsDoNotOverlap(forms.nth(index));
    }
  }

  await page.screenshot({
    fullPage: true,
    path: `test-results/forms-layout-mobile-${testInfo.project.name}.png`,
  });
});
