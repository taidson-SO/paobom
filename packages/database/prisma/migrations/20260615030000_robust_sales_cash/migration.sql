-- Robust sales and cash flow: detailed sale payments, register movements and reconciliation.

CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceCode" TEXT,
    "cardBrand" TEXT,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cash_register_movements" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_register_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cash_reconciliations" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "expectedAmount" DECIMAL(12,2) NOT NULL,
    "countedAmount" DECIMAL(12,2) NOT NULL,
    "differenceAmount" DECIMAL(12,2) NOT NULL,
    "reconciledBy" TEXT NOT NULL,
    "notes" TEXT,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_reconciliations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sale_payments_saleId_idx" ON "sale_payments"("saleId");
CREATE INDEX "sale_payments_method_idx" ON "sale_payments"("method");
CREATE INDEX "cash_register_movements_cashRegisterId_occurredAt_idx" ON "cash_register_movements"("cashRegisterId", "occurredAt");
CREATE INDEX "cash_register_movements_type_idx" ON "cash_register_movements"("type");
CREATE INDEX "cash_reconciliations_cashRegisterId_reconciledAt_idx" ON "cash_reconciliations"("cashRegisterId", "reconciledAt");
CREATE INDEX "cash_reconciliations_method_idx" ON "cash_reconciliations"("method");

ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_reconciliations" ADD CONSTRAINT "cash_reconciliations_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "sale_payments" ("id", "saleId", "method", "amount", "createdAt")
SELECT gen_random_uuid()::text, "id", "paymentMethod", GREATEST(0, (
  SELECT COALESCE(SUM("quantity" * "unitPrice"), 0)
  FROM "sale_items"
  WHERE "sale_items"."saleId" = "sales"."id"
) - "discountAmount"), COALESCE("paidAt", "createdAt")
FROM "sales"
WHERE "status" = 'paid';
