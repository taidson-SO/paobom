import { expect, Locator, Page, test } from "@playwright/test";

const allPermissions = [
  "dashboard:view",
  "reports:view",
  "audit:view",
  "purchase:view",
  "purchase:create",
  "purchase:receive",
  "purchase:cancel",
  "production:view",
  "production:manage-recipe",
  "production:manage-order",
  "production:cancel",
  "inventory:view",
  "inventory:adjust",
  "inventory:register-loss",
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
  let authenticated = false;

  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = corsHeaders(request.headers().origin);

    if (request.method() === "OPTIONS") {
      return route.fulfill({ headers, status: 204 });
    }

    if (!isApiUrl(url)) {
      return route.fallback();
    }

    if (url.pathname === "/auth/me") {
      if (!authenticated) {
        return route.fulfill({
          headers,
          json: { error: { message: "Nao autenticado", statusCode: 401 } },
          status: 401,
        });
      }

      return route.fulfill({
        headers,
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

    if (url.pathname === "/auth/login") {
      authenticated = true;

      return route.fulfill({
        headers,
        json: {
          data: {
            expiresAt: "2026-06-29T18:00:00.000Z",
            token: "mock-token",
            user: {
              email: "dono@paobom.local",
              id: "user-owner",
              name: "Dono PaoBom",
              permissions: allPermissions,
              role: "owner",
            },
          },
        },
      });
    }

    if (url.pathname === "/products") {
      return route.fulfill({ headers, json: { data: sampleProducts } });
    }

    if (url.pathname === "/suppliers") {
      return route.fulfill({ headers, json: { data: sampleSuppliers } });
    }

    if (url.pathname === "/customers") {
      return route.fulfill({ headers, json: { data: sampleCustomers } });
    }

    if (emptyListEndpoints.includes(url.pathname)) {
      return route.fulfill({ headers, json: { data: [] } });
    }

    return route.fulfill({ headers, json: { data: [] } });
  });
}

function isApiUrl(url: URL) {
  return ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.port.startsWith("33");
}

function corsHeaders(origin = "http://localhost:3000") {
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-origin": origin,
  };
}

async function openModule(page: Page, item: { id: string; label: string }) {
  await page.locator("nav").getByRole("link", { name: item.label }).click();
  await expect(page.locator(`#${item.id}`)).toBeVisible();
}

async function loginWithMockedUser(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("usuario@paobom.local").fill("dono@paobom.local");
  await page.getByPlaceholder("Sua senha").fill("Paobom@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Operacao da padaria" })).toBeVisible();
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
  await loginWithMockedUser(page);

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
  await loginWithMockedUser(page);

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
