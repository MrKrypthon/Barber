-- CreateTable
CREATE TABLE "cash_closings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "income" DECIMAL(10,2) NOT NULL,
    "expense" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "closed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_closings_tenant_id_idx" ON "cash_closings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_closings_tenant_id_date_key" ON "cash_closings"("tenant_id", "date");

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
