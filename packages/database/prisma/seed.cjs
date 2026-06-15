const { PrismaClient } = require("@prisma/client");
const { pbkdf2Sync, randomBytes } = require("node:crypto");

const prisma = new PrismaClient();
const seedPassword = process.env.SEED_USER_PASSWORD ?? "Paobom@123";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");

  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.authSession.deleteMany();
    await tx.cashRegister.deleteMany();
    await tx.cashEntry.deleteMany();
    await tx.saleItem.deleteMany();
    await tx.sale.deleteMany();
    await tx.productionConsumption.deleteMany();
    await tx.productionOrder.deleteMany();
    await tx.recipeIngredient.deleteMany();
    await tx.recipe.deleteMany();
    await tx.stockMovement.deleteMany();
    await tx.inventoryBalance.deleteMany();
    await tx.purchaseItem.deleteMany();
    await tx.purchase.deleteMany();
    await tx.customerInteraction.deleteMany();
    await tx.customer.deleteMany();
    await tx.supplier.deleteMany();
    await tx.product.deleteMany();
    await tx.user.deleteMany();

    await tx.user.createMany({
      data: [
        {
          id: "user-owner",
          name: "Dono PaoBom",
          email: "dono@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "owner",
        },
        {
          id: "user-manager",
          name: "Gerente PaoBom",
          email: "gerente@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "manager",
        },
        {
          id: "user-cashier",
          name: "Caixa PaoBom",
          email: "caixa@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "cashier",
        },
      ],
    });

    await tx.product.createMany({
      data: [
        {
          id: "prod-flour",
          name: "Farinha de trigo",
          sku: "INS-FARINHA",
          kind: "raw_material",
          unit: "kg",
          category: "Insumos",
          purchasePrice: "4.20",
          salePrice: "0.00",
          minimumStock: "30.000",
        },
        {
          id: "prod-yeast",
          name: "Fermento biologico",
          sku: "INS-FERMENTO",
          kind: "raw_material",
          unit: "kg",
          category: "Insumos",
          purchasePrice: "18.00",
          salePrice: "0.00",
          minimumStock: "3.000",
        },
        {
          id: "prod-bag",
          name: "Embalagem para pao",
          sku: "EMB-SACO-PAO",
          kind: "packaging",
          unit: "unit",
          category: "Embalagens",
          purchasePrice: "0.08",
          salePrice: "0.00",
          minimumStock: "500.000",
        },
        {
          id: "prod-bread",
          name: "Pao frances",
          sku: "PAD-PAO-FRANCES",
          kind: "finished_product",
          unit: "unit",
          category: "Padaria",
          purchasePrice: "0.25",
          salePrice: "0.90",
          minimumStock: "120.000",
        },
        {
          id: "prod-coffee",
          name: "Cafe coado",
          sku: "REV-CAFE-COADO",
          kind: "resale",
          unit: "unit",
          category: "Balcao",
          purchasePrice: "1.20",
          salePrice: "3.50",
          minimumStock: "20.000",
        },
      ],
    });

    await tx.supplier.create({
      data: {
        id: "supplier-moinho",
        name: "Moinho Recife",
        document: "11222333000144",
        contactName: "Ana Souza",
        phone: "81999990001",
        email: "compras@moinhorecife.local",
      },
    });

    await tx.customer.create({
      data: {
        id: "customer-balcao",
        name: "Cliente Balcao",
        document: "00000000000",
        phone: "81999990002",
        email: "cliente@paobom.local",
        notes: "Cliente generico para vendas de balcao",
        interactions: {
          create: {
            type: "note",
            description: "Cadastro inicial para vendas sem identificacao nominal.",
            occurredAt: new Date("2026-06-14T08:00:00.000Z"),
          },
        },
      },
    });

    await tx.purchase.create({
      data: {
        id: "purchase-flour-001",
        supplierId: "supplier-moinho",
        expectedDate: new Date("2026-06-14T09:00:00.000Z"),
        status: "received",
        notes: "Compra inicial de insumos",
        receivedAt: new Date("2026-06-14T10:00:00.000Z"),
        items: {
          create: [
            {
              productId: "prod-flour",
              quantity: "50.000",
              unitCost: "4.20",
            },
            {
              productId: "prod-yeast",
              quantity: "5.000",
              unitCost: "18.00",
            },
          ],
        },
      },
    });

    await tx.inventoryBalance.createMany({
      data: [
        {
          productId: "prod-flour",
          quantity: "42.000",
          averageCost: "4.20",
          minimumStock: "30.000",
        },
        {
          productId: "prod-yeast",
          quantity: "4.500",
          averageCost: "18.00",
          minimumStock: "3.000",
        },
        {
          productId: "prod-bag",
          quantity: "800.000",
          averageCost: "0.08",
          minimumStock: "500.000",
        },
        {
          productId: "prod-bread",
          quantity: "160.000",
          averageCost: "0.35",
          minimumStock: "120.000",
        },
        {
          productId: "prod-coffee",
          quantity: "35.000",
          averageCost: "1.20",
          minimumStock: "20.000",
        },
      ],
    });

    await tx.stockMovement.createMany({
      data: [
        {
          id: "movement-purchase-flour",
          productId: "prod-flour",
          type: "purchase_in",
          origin: "purchase",
          quantity: "50.000",
          unitCost: "4.20",
          reason: "Recebimento de compra",
          referenceId: "purchase-flour-001",
          occurredAt: new Date("2026-06-14T10:00:00.000Z"),
        },
        {
          id: "movement-production-flour",
          productId: "prod-flour",
          type: "production_out",
          origin: "production",
          quantity: "8.000",
          unitCost: "4.20",
          reason: "Consumo em fornada",
          referenceId: "production-bread-001",
          occurredAt: new Date("2026-06-14T11:00:00.000Z"),
        },
        {
          id: "movement-production-bread",
          productId: "prod-bread",
          type: "production_in",
          origin: "production",
          quantity: "180.000",
          unitCost: "0.35",
          reason: "Entrada de producao",
          referenceId: "production-bread-001",
          occurredAt: new Date("2026-06-14T12:00:00.000Z"),
        },
      ],
    });

    await tx.recipe.create({
      data: {
        id: "recipe-bread-v1",
        name: "Pao frances",
        version: 1,
        outputProductId: "prod-bread",
        yieldQuantity: "180.000",
        ingredients: {
          create: [
            {
              productId: "prod-flour",
              quantity: "8.000",
            },
            {
              productId: "prod-yeast",
              quantity: "0.500",
            },
          ],
        },
      },
    });

    await tx.productionOrder.create({
      data: {
        id: "production-bread-001",
        recipeId: "recipe-bread-v1",
        recipeSnapshot: {
          recipeId: "recipe-bread-v1",
          recipeName: "Pao frances",
          recipeVersion: 1,
          outputProductId: "prod-bread",
          yieldQuantity: 180,
          ingredients: [
            { productId: "prod-flour", quantity: 8 },
            { productId: "prod-yeast", quantity: 0.5 },
          ],
        },
        outputProductId: "prod-bread",
        quantityProduced: "180.000",
        status: "finished",
        notes: "Fornada inicial",
        startedAt: new Date("2026-06-14T11:00:00.000Z"),
        completedAt: new Date("2026-06-14T12:00:00.000Z"),
        ingredientConsumptions: {
          create: [
            {
              productId: "prod-flour",
              quantity: "8.000",
              unitCost: "4.20",
            },
            {
              productId: "prod-yeast",
              quantity: "0.500",
              unitCost: "18.00",
            },
          ],
        },
      },
    });

    await tx.sale.create({
      data: {
        id: "sale-balcao-001",
        customerId: "customer-balcao",
        status: "paid",
        paymentMethod: "pix",
        discountAmount: "0.00",
        notes: "Venda de balcao",
        paidAt: new Date("2026-06-14T13:00:00.000Z"),
        items: {
          create: [
            {
              productId: "prod-bread",
              quantity: "20.000",
              unitPrice: "0.90",
              unitCost: "0.35",
            },
            {
              productId: "prod-coffee",
              quantity: "2.000",
              unitPrice: "3.50",
              unitCost: "1.20",
            },
          ],
        },
      },
    });

    await tx.cashEntry.createMany({
      data: [
        {
          id: "cash-entry-sale-001",
          type: "income",
          status: "settled",
          category: "Vendas",
          description: "Venda balcao 001",
          amount: "25.00",
          dueDate: new Date("2026-06-14T13:00:00.000Z"),
          settledAt: new Date("2026-06-14T13:00:00.000Z"),
          referenceId: "sale-balcao-001",
        },
        {
          id: "cash-entry-purchase-001",
          type: "expense",
          status: "pending",
          category: "Compras",
          description: "Compra inicial de insumos",
          amount: "300.00",
          dueDate: new Date("2026-06-21T12:00:00.000Z"),
          referenceId: "purchase-flour-001",
        },
      ],
    });

    await tx.cashRegister.create({
      data: {
        id: "cash-register-001",
        status: "open",
        openingAmount: "100.00",
        openedAt: new Date("2026-06-14T07:00:00.000Z"),
        openedBy: "user-cashier",
      },
    });

    await tx.auditLog.create({
      data: {
        id: "audit-seed-001",
        action: "database.seed",
        entity: "database",
        entityId: null,
        userId: "user-owner",
        userName: "Dono PaoBom",
        userRole: "owner",
        result: "success",
        description: "Seed inicial do banco persistente",
        metadata: {
          version: "phase-15",
          source: "packages/database/prisma/seed.cjs",
        },
        occurredAt: new Date("2026-06-14T07:00:00.000Z"),
      },
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
