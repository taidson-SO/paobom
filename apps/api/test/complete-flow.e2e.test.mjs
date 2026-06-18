import assert from "node:assert/strict";
import { test } from "node:test";

const apiBaseUrl = process.env.E2E_API_BASE_URL;
const password = process.env.SEED_USER_PASSWORD ?? "Paobom@123";

if (!apiBaseUrl) {
  throw new Error("E2E_API_BASE_URL nao configurada");
}

test("sessao Web usa cookie HttpOnly e logout revoga acesso", async () => {
  const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
    body: JSON.stringify({
      email: "dono@paobom.local",
      password,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const loginPayload = await loginResponse.json();
  const setCookie = loginResponse.headers.get("set-cookie");

  assert.equal(loginResponse.ok, true);
  assert.ok(loginPayload.data.token, "Mobile ainda deve receber bearer token");
  assert.match(setCookie ?? "", /paobom_session=/);
  assert.match(setCookie ?? "", /HttpOnly/i);
  assert.match(setCookie ?? "", /SameSite=Lax/i);

  const cookie = setCookie?.split(";")[0];
  const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Cookie: cookie ?? "" },
  });
  const mePayload = await meResponse.json();

  assert.equal(meResponse.ok, true);
  assert.equal(mePayload.data.email, "dono@paobom.local");

  const logoutResponse = await fetch(`${apiBaseUrl}/auth/logout`, {
    body: "{}",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie ?? "",
    },
    method: "POST",
  });

  assert.equal(logoutResponse.ok, true);
  assert.match(logoutResponse.headers.get("set-cookie") ?? "", /Max-Age=0/i);

  const revokedResponse = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Cookie: cookie ?? "" },
  });

  assert.equal(revokedResponse.status, 401);
});

test("compra -> estoque -> producao -> venda -> caixa -> relatorio -> auditoria", async () => {
  const session = await request("/auth/login", {
    body: {
      email: "dono@paobom.local",
      password,
    },
    method: "POST",
    withAuth: false,
  });
  const token = session.token;
  const initialBalances = await request("/inventory/balances", { token });
  const initialFlour = findBalance(initialBalances, "prod-flour");
  const initialBread = findBalance(initialBalances, "prod-bread");
  const expectedDate = new Date(Date.now() + 86_400_000).toISOString();

  const purchase = await request("/purchases", {
    body: {
      expectedDate,
      items: [
        {
          productId: "prod-flour",
          quantity: 12,
          unitCost: 5.1,
        },
      ],
      notes: "E2E fluxo completo",
      supplierId: "supplier-moinho",
    },
    method: "POST",
    token,
  });

  assert.equal(purchase.status, "pending_approval");

  const approvedPurchase = await request(`/purchases/${purchase.id}/approve`, {
    body: { approvedBy: "Dono E2E" },
    method: "POST",
    token,
  });

  assert.equal(approvedPurchase.status, "approved");
  assert.equal(Number(approvedPurchase.payable.amount), 61.2);

  const receivedPurchase = await request(`/purchases/${purchase.id}/receive`, {
    body: {
      items: [
        {
          expirationDate: new Date(Date.now() + 90 * 86_400_000).toISOString(),
          lotCode: `E2E-FLOUR-${purchase.id}`,
          productId: "prod-flour",
          receivedQuantity: 12,
        },
      ],
      receivedBy: "Estoque E2E",
    },
    method: "POST",
    token,
  });

  assert.equal(receivedPurchase.status, "received");

  const balancesAfterPurchase = await request("/inventory/balances", { token });
  const flourAfterPurchase = findBalance(
    balancesAfterPurchase,
    "prod-flour",
  );

  assert.equal(flourAfterPurchase.quantity, initialFlour.quantity + 12);
  assert.ok(flourAfterPurchase.averageCost > initialFlour.averageCost);

  const production = await request("/production/orders", {
    body: {
      notes: "Fornada E2E",
      quantityProduced: 180,
      recipeId: "recipe-bread-v1",
    },
    method: "POST",
    token,
  });

  assert.equal(production.status, "planned");

  const startedProduction = await request(
    `/production/orders/${production.id}/start`,
    {
      body: {},
      method: "POST",
      token,
    },
  );

  assert.equal(startedProduction.status, "started");

  const finishedProduction = await request(
    `/production/orders/${production.id}/finish`,
    {
      body: {},
      method: "POST",
      token,
    },
  );

  assert.equal(finishedProduction.status, "finished");

  const balancesAfterProduction = await request("/inventory/balances", {
    token,
  });
  const flourAfterProduction = findBalance(
    balancesAfterProduction,
    "prod-flour",
  );
  const breadAfterProduction = findBalance(
    balancesAfterProduction,
    "prod-bread",
  );

  assert.equal(flourAfterProduction.quantity, initialFlour.quantity + 4);
  assert.equal(breadAfterProduction.quantity, initialBread.quantity + 180);

  const sale = await request("/sales", {
    body: {
      customerId: "customer-balcao",
      discountAmount: 0,
      items: [
        {
          productId: "prod-bread",
          quantity: 20,
          unitPrice: 0.9,
        },
      ],
      notes: "Venda E2E",
      paymentMethod: "cash",
    },
    method: "POST",
    token,
  });

  assert.equal(sale.status, "paid");
  assert.equal(Number(sale.payments[0].amount), 18);

  const finalBalances = await request("/inventory/balances", { token });
  const finalBread = findBalance(finalBalances, "prod-bread");

  assert.equal(finalBread.quantity, initialBread.quantity + 160);

  const movements = await request("/inventory/movements", { token });

  assert.ok(
    movements.some(
      (movement) =>
        movement.referenceId === purchase.id &&
        movement.type === "purchase_in",
    ),
  );
  assert.ok(
    movements.some(
      (movement) =>
        movement.referenceId === production.id &&
        movement.type === "production_out",
    ),
  );
  assert.ok(
    movements.some(
      (movement) =>
        movement.referenceId === production.id &&
        movement.type === "production_in",
    ),
  );
  assert.ok(
    movements.some(
      (movement) =>
        movement.referenceId === sale.id && movement.type === "sale_out",
    ),
  );

  const cashEntries = await request("/cash/entries", { token });
  const saleCashEntry = cashEntries.find(
    (entry) => entry.referenceId === sale.id,
  );

  assert.ok(saleCashEntry);
  assert.equal(saleCashEntry.status, "settled");
  assert.equal(Number(saleCashEntry.amount), 18);

  const registers = await request("/cash/registers", { token });
  const openRegister = registers.find((register) => register.status === "open");

  assert.ok(openRegister, "Seed deve fornecer um caixa aberto");

  const registerMovements = await request("/cash/registers/movements", {
    token,
  });
  const expectedAmount = calculateExpectedCash(
    openRegister,
    cashEntries,
    registerMovements,
  );
  const closedRegister = await request(
    `/cash/registers/${openRegister.id}/close`,
    {
      body: {
        closedBy: "Dono E2E",
        countedAmount: expectedAmount,
      },
      method: "POST",
      token,
    },
  );

  assert.equal(closedRegister.status, "closed");
  assert.equal(Number(closedRegister.differenceAmount), 0);
  assert.equal(Number(closedRegister.expectedAmount), expectedAmount);

  const endDate = new Date(Date.now() + 86_400_000).toISOString();
  const reports = await request(
    `/reports?startDate=2026-01-01T00:00:00.000Z&endDate=${encodeURIComponent(endDate)}`,
    { token },
  );

  assert.ok(reports.purchases.totalPurchased >= 61.2);
  assert.ok(reports.production.totalProduced >= 180);
  assert.ok(reports.sales.totalRevenue >= 18);
  assert.ok(reports.cashFlow.balance >= 18);

  const auditLogs = await request("/audit-logs", { token });
  const expectedAudits = [
    ["purchase", "purchase.create", purchase.id],
    ["purchase", "purchase.approve", purchase.id],
    ["purchase", "purchase.receive", purchase.id],
    ["production_order", "production_order.create", production.id],
    ["production_order", "production_order.start", production.id],
    ["production_order", "production_order.finish", production.id],
    ["sale", "sale.create", sale.id],
    ["cash_register", "cash_register.close", openRegister.id],
  ];

  for (const [entity, action, entityId] of expectedAudits) {
    assert.ok(
      auditLogs.some(
        (log) =>
          log.action === action &&
          log.entity === entity &&
          log.entityId === entityId &&
          log.result === "success",
      ),
      `Auditoria ausente: ${action} (${entityId})`,
    );
  }
});

async function request(
  path,
  { body, method = "GET", token, withAuth = true } = {},
) {
  const headers = new Headers();

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (withAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  });
  const payload = await response.json();

  assert.equal(
    response.ok,
    true,
    `${method} ${path}: ${payload.error?.message ?? response.status}`,
  );

  return payload.data;
}

function findBalance(balances, productId) {
  const balance = balances.find((entry) => entry.productId === productId);

  assert.ok(balance, `Saldo nao encontrado para ${productId}`);

  return {
    ...balance,
    averageCost: Number(balance.averageCost),
    minimumStock: Number(balance.minimumStock),
    quantity: Number(balance.quantity),
  };
}

function calculateExpectedCash(register, entries, movements) {
  const openedAt = new Date(register.openedAt).getTime();
  const entriesTotal = entries
    .filter(
      (entry) =>
        entry.status === "settled" &&
        entry.settledAt &&
        new Date(entry.settledAt).getTime() >= openedAt,
    )
    .reduce(
      (sum, entry) =>
        sum +
        (entry.type === "income" ? 1 : -1) * Number(entry.amount),
      Number(register.openingAmount),
    );
  const withMovements = movements
    .filter(
      (movement) =>
        movement.cashRegisterId === register.id &&
        new Date(movement.occurredAt).getTime() >= openedAt,
    )
    .reduce(
      (sum, movement) =>
        sum +
        (movement.type === "supply" ? 1 : -1) * Number(movement.amount),
      entriesTotal,
    );

  return Math.round(withMovements * 100) / 100;
}
