CREATE UNIQUE INDEX "cash_registers_single_open_key"
  ON "cash_registers"("status")
  WHERE "status" = 'open';
