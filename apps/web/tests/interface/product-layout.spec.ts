import { expect, Page, test } from "@playwright/test";

const ownerUser = {
  email: "dono@paobom.local",
  id: "user-owner",
  name: "Dono PaoBom",
  permissions: [
    "dashboard:view",
    "product:view",
    "product:manage",
    "supplier:view",
    "customer:view",
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
  await page.route("**/*", (route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({
        headers: corsHeaders(),
        status: 204,
      });
    }

    return route.fallback();
  });
  await page.route("**/auth/me**", (route) =>
    route.fulfill({ headers: corsHeaders(), json: { data: ownerUser } }),
  );
  await page.route("**/products**", (route) =>
    route.fulfill({ headers: corsHeaders(), json: { data: products } }),
  );
}

function corsHeaders() {
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-origin": "http://localhost:3000",
  };
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

test("formulario de produtos nao sobrepoe campos no desktop", async ({
  page,
}, testInfo) => {
  await mockProductModuleApi(page);
  await page.goto("/#produtos");

  await expect(page.locator("#produtos")).toBeVisible();
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
  await page.goto("/#produtos");

  await expect(page.locator("#produtos")).toBeVisible();
  await expectNoFieldOverlap(page);
  await page.screenshot({
    fullPage: true,
    path: `test-results/product-layout-mobile-${testInfo.project.name}.png`,
  });
});
