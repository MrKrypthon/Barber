-- CreateTable
CREATE TABLE "business_settings" (
    "tenant_id" TEXT NOT NULL,
    "logo" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
