-- Real purchase workflow: approval, partial receiving, divergences, payables and history.

ALTER TYPE "PurchaseStatus" ADD VALUE 'pending_approval';
ALTER TYPE "PurchaseStatus" ADD VALUE 'approved';
ALTER TYPE "PurchaseStatus" ADD VALUE 'partially_received';

ALTER TABLE "purchases" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "purchase_items" ADD COLUMN "receivedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0;

UPDATE "purchase_items"
SET "receivedQuantity" = "quantity"
WHERE "purchaseId" IN (
  SELECT "id" FROM "purchases" WHERE "status" = 'received'
);

CREATE TABLE "purchase_history" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_payables" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_payables_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_history_purchaseId_occurredAt_idx" ON "purchase_history"("purchaseId", "occurredAt");
CREATE INDEX "purchase_history_action_idx" ON "purchase_history"("action");
CREATE UNIQUE INDEX "purchase_payables_purchaseId_key" ON "purchase_payables"("purchaseId");
CREATE INDEX "purchase_payables_supplierId_idx" ON "purchase_payables"("supplierId");
CREATE INDEX "purchase_payables_status_idx" ON "purchase_payables"("status");
CREATE INDEX "purchase_payables_dueDate_idx" ON "purchase_payables"("dueDate");

ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_payables" ADD CONSTRAINT "purchase_payables_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_payables" ADD CONSTRAINT "purchase_payables_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
