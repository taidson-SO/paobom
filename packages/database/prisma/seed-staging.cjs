const { PrismaClient } = require("@prisma/client");
const { pbkdf2Sync, randomBytes } = require("node:crypto");
const { seedBase } = require("./seed.cjs");

const prisma = new PrismaClient();
const defaultSeedPassword = "Paobom@123";
const seedPassword = process.env.SEED_USER_PASSWORD ?? defaultSeedPassword;

if (
  seedPassword === defaultSeedPassword &&
  process.env.ALLOW_DEFAULT_SEED_PASSWORD !== "true"
) {
  throw new Error(
    "SEED_USER_PASSWORD deve ser definido para seed de staging. Use ALLOW_DEFAULT_SEED_PASSWORD=true apenas em ambientes descartaveis.",
  );
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");

  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

async function main() {
  await seedBase(prisma);

  await prisma.$transaction(async (tx) => {
    await tx.user.createMany({
      data: [
        {
          id: "user-baker",
          name: "Padeiro PaoBom",
          email: "padeiro@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "baker",
        },
        {
          id: "user-stock",
          name: "Estoque PaoBom",
          email: "estoque@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "stock",
        },
        {
          id: "user-sales",
          name: "Atendente PaoBom",
          email: "vendas@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "sales",
        },
        {
          id: "user-viewer",
          name: "Consultor PaoBom",
          email: "consulta@paobom.local",
          passwordHash: hashPassword(seedPassword),
          role: "viewer",
        },
      ],
    });

    await tx.supplier.createMany({
      data: [
        {
          id: "supplier-laticinios",
          name: "Laticinios Boa Vista",
          document: "22333444000155",
          contactName: "Marcos Lima",
          phone: "81999990003",
          email: "pedidos@boavista.local",
        },
        {
          id: "supplier-embalagens",
          name: "Embalagens Nordeste",
          document: "33444555000166",
          contactName: "Rita Alves",
          phone: "81999990004",
          email: "comercial@embalagensnordeste.local",
        },
      ],
    });

    await tx.product.createMany({
      data: [
        {
          id: "prod-cheese",
          name: "Queijo mussarela",
          sku: "INS-QUEIJO",
          kind: "raw_material",
          unit: "kg",
          category: "Frios",
          purchasePrice: "32.00",
          salePrice: "0.00",
          minimumStock: "8.000",
        },
        {
          id: "prod-cake",
          name: "Bolo de macaxeira",
          sku: "PAD-BOLO-MACAXEIRA",
          kind: "finished_product",
          unit: "unit",
          category: "Confeitaria",
          purchasePrice: "8.50",
          salePrice: "24.00",
          minimumStock: "6.000",
        },
      ],
    });

    await tx.inventoryBalance.createMany({
      data: [
        {
          productId: "prod-cheese",
          quantity: "6.000",
          averageCost: "32.00",
          minimumStock: "8.000",
        },
        {
          productId: "prod-cake",
          quantity: "4.000",
          averageCost: "9.40",
          minimumStock: "6.000",
        },
      ],
    });

    await tx.inventoryLot.createMany({
      data: [
        {
          id: "lot-cheese-001",
          productId: "prod-cheese",
          lotCode: "QUE-2026-06-13",
          quantity: "6.000",
          unitCost: "32.00",
          expirationDate: new Date("2026-06-25T00:00:00.000Z"),
          supplierId: "supplier-laticinios",
          receivedAt: new Date("2026-06-13T09:00:00.000Z"),
        },
        {
          id: "lot-cake-001",
          productId: "prod-cake",
          lotCode: "PROD-2026-06-15-BOLO",
          quantity: "4.000",
          unitCost: "9.40",
          expirationDate: new Date("2026-06-17T00:00:00.000Z"),
          receivedAt: new Date("2026-06-15T06:30:00.000Z"),
        },
      ],
    });

    await tx.customer.createMany({
      data: [
        {
          id: "customer-hotel-sol",
          name: "Hotel Sol Nascente",
          document: "44555666000177",
          phone: "81999990005",
          email: "compras@hotelsol.local",
          notes: "Cliente recorrente com faturamento semanal.",
        },
        {
          id: "customer-escola-vila",
          name: "Escola Vila Feliz",
          document: "55666777000188",
          phone: "81999990006",
          email: "cantina@vilafeliz.local",
          notes: "Pedidos de lanche por encomenda.",
        },
      ],
    });

    await tx.customerInteraction.createMany({
      data: [
        {
          customerId: "customer-hotel-sol",
          type: "whatsapp",
          description: "Solicitou cotacao semanal de paes e bolos.",
          occurredAt: new Date("2026-06-15T09:20:00.000Z"),
        },
        {
          customerId: "customer-escola-vila",
          type: "call",
          description: "Confirmou entrega para evento de sexta-feira.",
          occurredAt: new Date("2026-06-15T10:10:00.000Z"),
        },
      ],
    });

    await tx.purchase.create({
      data: {
        id: "purchase-cheese-001",
        supplierId: "supplier-laticinios",
        expectedDate: new Date("2026-06-16T09:00:00.000Z"),
        status: "partially_received",
        notes: "Recebimento parcial para validar divergencia operacional.",
        receivedAt: new Date("2026-06-15T11:00:00.000Z"),
        approvedAt: new Date("2026-06-15T08:40:00.000Z"),
        approvedBy: "Gerente PaoBom",
        items: {
          create: {
            productId: "prod-cheese",
            quantity: "12.000",
            receivedQuantity: "6.000",
            unitCost: "32.00",
          },
        },
        history: {
          create: [
            {
              action: "created",
              actor: "Gerente PaoBom",
              description: "Pedido de queijo criado para reforco da semana.",
              occurredAt: new Date("2026-06-15T08:30:00.000Z"),
            },
            {
              action: "approved",
              actor: "Dono PaoBom",
              description: "Compra aprovada para staging.",
              occurredAt: new Date("2026-06-15T08:40:00.000Z"),
            },
            {
              action: "received",
              actor: "Estoque PaoBom",
              description: "Entrega parcial: fornecedor trouxe metade do pedido.",
              occurredAt: new Date("2026-06-15T11:00:00.000Z"),
            },
          ],
        },
        payable: {
          create: {
            amount: "384.00",
            dueDate: new Date("2026-06-22T00:00:00.000Z"),
            paidAmount: "0.00",
            status: "open",
            supplierId: "supplier-laticinios",
          },
        },
      },
    });

    await tx.stockMovement.createMany({
      data: [
        {
          id: "movement-purchase-cheese",
          productId: "prod-cheese",
          lotId: "lot-cheese-001",
          type: "purchase_in",
          origin: "purchase",
          quantity: "6.000",
          unitCost: "32.00",
          reason: "Recebimento parcial de compra",
          referenceId: "purchase-cheese-001",
          occurredAt: new Date("2026-06-15T11:00:00.000Z"),
        },
        {
          id: "movement-loss-bread-staging",
          productId: "prod-bread",
          lotId: "lot-bread-001",
          type: "loss",
          origin: "loss",
          quantity: "8.000",
          unitCost: "0.35",
          reason: "Perda por sobra de vitrine no fechamento",
          referenceId: "staging-loss-001",
          occurredAt: new Date("2026-06-15T18:20:00.000Z"),
        },
      ],
    });

    await tx.physicalInventoryCount.create({
      data: {
        id: "count-cheese-staging",
        productId: "prod-cheese",
        expectedQuantity: "6.000",
        countedQuantity: "5.700",
        divergenceQuantity: "-0.300",
        reason: "Quebra operacional observada no fracionamento.",
        countedBy: "Estoque PaoBom",
        countedAt: new Date("2026-06-15T17:30:00.000Z"),
      },
    });

    await tx.recipe.create({
      data: {
        id: "recipe-cake-v1",
        name: "Bolo de macaxeira",
        version: 1,
        outputProductId: "prod-cake",
        yieldQuantity: "10.000",
        ingredients: {
          create: [
            {
              productId: "prod-flour",
              quantity: "2.000",
            },
            {
              productId: "prod-cheese",
              quantity: "0.500",
            },
          ],
        },
      },
    });

    await tx.productionOrder.create({
      data: {
        id: "production-cake-001",
        recipeId: "recipe-cake-v1",
        recipeSnapshot: {
          recipeId: "recipe-cake-v1",
          recipeName: "Bolo de macaxeira",
          recipeVersion: 1,
          outputProductId: "prod-cake",
          yieldQuantity: 10,
          ingredients: [
            { productId: "prod-flour", quantity: 2 },
            { productId: "prod-cheese", quantity: 0.5 },
          ],
        },
        outputProductId: "prod-cake",
        quantityProduced: "10.000",
        status: "finished",
        notes: "Producao staging para vitrine e encomendas.",
        startedAt: new Date("2026-06-15T05:40:00.000Z"),
        completedAt: new Date("2026-06-15T06:30:00.000Z"),
        ingredientConsumptions: {
          create: [
            {
              productId: "prod-flour",
              quantity: "2.000",
              unitCost: "4.20",
            },
            {
              productId: "prod-cheese",
              quantity: "0.500",
              unitCost: "32.00",
            },
          ],
        },
      },
    });

    await tx.productionOrder.create({
      data: {
        id: "production-cake-planned-001",
        recipeId: "recipe-cake-v1",
        recipeSnapshot: {
          recipeId: "recipe-cake-v1",
          recipeName: "Bolo de macaxeira",
          recipeVersion: 1,
          outputProductId: "prod-cake",
          yieldQuantity: 10,
          ingredients: [
            { productId: "prod-flour", quantity: 2 },
            { productId: "prod-cheese", quantity: 0.5 },
          ],
        },
        outputProductId: "prod-cake",
        quantityProduced: "5.000",
        status: "planned",
        notes: "Ordem planejada para validar operacao pelo mobile.",
        ingredientConsumptions: {
          create: [
            {
              productId: "prod-flour",
              quantity: "1.000",
              unitCost: "4.20",
            },
            {
              productId: "prod-cheese",
              quantity: "0.250",
              unitCost: "32.00",
            },
          ],
        },
      },
    });

    await tx.sale.createMany({
      data: [
        {
          id: "sale-staging-card-001",
          customerId: "customer-hotel-sol",
          status: "paid",
          paymentMethod: "card",
          discountAmount: "6.00",
          discountAuthorizedBy: "user-manager",
          discountReason: "Desconto comercial para cliente recorrente",
          notes: "Venda staging faturamento hotel",
          paidAt: new Date("2026-06-15T12:00:00.000Z"),
        },
        {
          id: "sale-staging-cash-001",
          customerId: "customer-balcao",
          status: "paid",
          paymentMethod: "cash",
          discountAmount: "0.00",
          notes: "Movimento de balcao no almoco",
          paidAt: new Date("2026-06-15T12:40:00.000Z"),
        },
        {
          id: "sale-staging-invoice-001",
          customerId: "customer-escola-vila",
          status: "open",
          paymentMethod: "invoice",
          discountAmount: "0.00",
          notes: "Pedido a prazo para evento escolar",
        },
      ],
    });

    await tx.saleItem.createMany({
      data: [
        {
          saleId: "sale-staging-card-001",
          productId: "prod-bread",
          quantity: "80.000",
          unitPrice: "0.90",
          unitCost: "0.35",
        },
        {
          saleId: "sale-staging-card-001",
          productId: "prod-cake",
          quantity: "3.000",
          unitPrice: "24.00",
          unitCost: "9.40",
        },
        {
          saleId: "sale-staging-cash-001",
          productId: "prod-coffee",
          quantity: "6.000",
          unitPrice: "3.50",
          unitCost: "1.20",
        },
        {
          saleId: "sale-staging-invoice-001",
          productId: "prod-bread",
          quantity: "120.000",
          unitPrice: "0.90",
          unitCost: "0.35",
        },
      ],
    });

    await tx.salePayment.createMany({
      data: [
        {
          id: "sale-payment-staging-card-001",
          saleId: "sale-staging-card-001",
          method: "card",
          amount: "138.00",
          referenceCode: "STG-CARD-001",
          cardBrand: "Visa",
          installments: 1,
        },
        {
          id: "sale-payment-staging-cash-001",
          saleId: "sale-staging-cash-001",
          method: "cash",
          amount: "21.00",
          installments: 1,
        },
        {
          id: "sale-payment-staging-invoice-001",
          saleId: "sale-staging-invoice-001",
          method: "invoice",
          amount: "108.00",
          referenceCode: "STG-FAT-001",
          installments: 1,
        },
      ],
    });

    await tx.cashEntry.createMany({
      data: [
        {
          id: "cash-entry-staging-card-001",
          type: "income",
          status: "settled",
          category: "Vendas",
          description: "Venda staging hotel - cartao",
          amount: "138.00",
          dueDate: new Date("2026-06-15T12:00:00.000Z"),
          settledAt: new Date("2026-06-15T12:00:00.000Z"),
          referenceId: "sale-staging-card-001",
        },
        {
          id: "cash-entry-staging-cash-001",
          type: "income",
          status: "settled",
          category: "Vendas",
          description: "Venda staging balcao - dinheiro",
          amount: "21.00",
          dueDate: new Date("2026-06-15T12:40:00.000Z"),
          settledAt: new Date("2026-06-15T12:40:00.000Z"),
          referenceId: "sale-staging-cash-001",
        },
        {
          id: "cash-entry-staging-invoice-001",
          type: "income",
          status: "pending",
          category: "Vendas a prazo",
          description: "Venda staging escola - a prazo",
          amount: "108.00",
          dueDate: new Date("2026-06-20T00:00:00.000Z"),
          referenceId: "sale-staging-invoice-001",
        },
        {
          id: "cash-entry-staging-expense-001",
          type: "expense",
          status: "settled",
          category: "Despesas operacionais",
          description: "Reposicao emergencial de gas",
          amount: "90.00",
          dueDate: new Date("2026-06-15T15:00:00.000Z"),
          settledAt: new Date("2026-06-15T15:10:00.000Z"),
          referenceId: "staging-expense-gas",
        },
      ],
    });

    await tx.cashRegister.create({
      data: {
        id: "cash-register-staging-closed-001",
        status: "closed",
        openingAmount: "120.00",
        openedAt: new Date("2026-06-13T07:00:00.000Z"),
        openedBy: "user-cashier",
        closedAt: new Date("2026-06-13T19:00:00.000Z"),
        closedBy: "user-manager",
        countedAmount: "1210.00",
        expectedAmount: "1208.50",
        differenceAmount: "1.50",
        closingNote: "Sobra pequena mantida para conferencia de staging.",
      },
    });

    await tx.cashReconciliation.createMany({
      data: [
        {
          id: "cash-reconciliation-card-staging",
          cashRegisterId: "cash-register-001",
          method: "card",
          expectedAmount: "138.00",
          countedAmount: "138.00",
          differenceAmount: "0.00",
          reconciledBy: "user-cashier",
          notes: "Conciliacao TEF staging",
          reconciledAt: new Date("2026-06-15T17:00:00.000Z"),
        },
        {
          id: "cash-reconciliation-cash-staging",
          cashRegisterId: "cash-register-001",
          method: "cash",
          expectedAmount: "21.00",
          countedAmount: "20.50",
          differenceAmount: "-0.50",
          reconciledBy: "user-manager",
          notes: "Diferenca pequena para validar alerta operacional",
          reconciledAt: new Date("2026-06-15T17:20:00.000Z"),
        },
      ],
    });

    await tx.auditLog.create({
      data: {
        id: "audit-staging-seed-001",
        action: "database.seed.staging",
        entity: "database",
        entityId: null,
        userId: "user-owner",
        userName: "Dono PaoBom",
        userRole: "owner",
        result: "success",
        description: "Seed staging com dados simulados proximos da operacao real",
        metadata: {
          environment: "staging",
          users: 7,
          source: "packages/database/prisma/seed-staging.cjs",
        },
        occurredAt: new Date("2026-06-15T07:00:00.000Z"),
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
