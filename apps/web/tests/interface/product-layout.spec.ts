import { expect, Page, test } from "@playwright/test";

const ownerUser = {
  email: "dono@paobom.local",
  id: "user-owner",
  name: "Dono PaoBom",
  permissions: [
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
  ],
  role: "owner",
};

const products = [
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
];

async function mockProductModuleApi(page: Page) {
  let authenticated = false;

  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = corsHeaders(route.request().headers().origin);

    if (request.method() === "OPTIONS") {
      return route.fulfill({
        headers,
        status: 204,
      });
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

      return route.fulfill({ headers, json: { data: ownerUser } });
    }

    if (url.pathname === "/auth/login") {
      authenticated = true;

      return route.fulfill({
        headers,
        json: {
          data: {
            expiresAt: "2026-06-29T18:00:00.000Z",
            token: "mock-token",
            user: ownerUser,
          },
        },
      });
    }

    if (url.pathname === "/products") {
      return route.fulfill({ headers, json: { data: products } });
    }

    return route.fulfill({ headers, json: { data: [] } });
  });
}

function corsHeaders(origin = "http://localhost:3000") {
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-origin": origin,
  };
}

function isApiUrl(url: URL) {
  return ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.port.startsWith("33");
}

async function expectNoFieldOverlap(page: Page) {
  const boxes = await page
    .locator("#produtos input")
    .evaluateAll((inputs) =>
      inputs.map((input) => {
        const rect = input.getBoundingClientRect();

        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        };
      }),
    );

  for (let index = 0; index < boxes.length; index += 1) {
    const current = boxes[index];

    for (const next of boxes.slice(index + 1)) {
      const overlaps =
        current.left < next.right &&
        current.right > next.left &&
        current.top < next.bottom &&
        current.bottom > next.top;

      expect(overlaps, JSON.stringify({ current, next })).toBe(false);
    }
  }
}

async function openProductModule(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("usuario@paobom.local").fill("dono@paobom.local");
  await page.getByPlaceholder("Sua senha").fill("Paobom@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Operacao da padaria" }),
  ).toBeVisible();
  await page.locator("nav").getByRole("link", { name: "Produtos" }).click();
  await expect(page.locator("#produtos")).toBeVisible();
}

test("formulario de produtos nao sobrepoe campos no desktop", async ({
  page,
}, testInfo) => {
  await mockProductModuleApi(page);
  await openProductModule(page);
  await expectNoFieldOverlap(page);
  await page.screenshot({
    fullPage: true,
    path: `test-results/product-layout-desktop-${testInfo.project.name}.png`,
  });
});

test("formulario de produtos nao sobrepoe campos no mobile", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockProductModuleApi(page);
  await openProductModule(page);
  await expectNoFieldOverlap(page);
  await page.screenshot({
    fullPage: true,
    path: `test-results/product-layout-mobile-${testInfo.project.name}.png`,
  });
});
