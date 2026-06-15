-- Advanced inventory tracking: lots, expirations, physical counts and lot-aware movements.

CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "supplierId" TEXT,
    "purchaseId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "physical_inventory_counts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedQuantity" DECIMAL(12,3) NOT NULL,
    "countedQuantity" DECIMAL(12,3) NOT NULL,
    "divergenceQuantity" DECIMAL(12,3) NOT NULL,
    "reason" TEXT,
    "countedBy" TEXT NOT NULL,
    "countedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_inventory_counts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "stock_movements" ADD COLUMN "lotId" TEXT;

CREATE UNIQUE INDEX "inventory_lots_productId_lotCode_key" ON "inventory_lots"("productId", "lotCode");
CREATE INDEX "inventory_lots_productId_status_idx" ON "inventory_lots"("productId", "status");
CREATE INDEX "inventory_lots_expirationDate_idx" ON "inventory_lots"("expirationDate");
CREATE INDEX "inventory_lots_supplierId_idx" ON "inventory_lots"("supplierId");
CREATE INDEX "inventory_lots_purchaseId_idx" ON "inventory_lots"("purchaseId");
CREATE INDEX "physical_inventory_counts_productId_countedAt_idx" ON "physical_inventory_counts"("productId", "countedAt");
CREATE INDEX "physical_inventory_counts_countedAt_idx" ON "physical_inventory_counts"("countedAt");
CREATE INDEX "stock_movements_lotId_idx" ON "stock_movements"("lotId");

ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "physical_inventory_counts" ADD CONSTRAINT "physical_inventory_counts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
