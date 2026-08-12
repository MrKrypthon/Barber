-- AlterTable
ALTER TABLE "business_settings" ADD COLUMN     "schedule_close" TEXT,
ADD COLUMN     "schedule_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "schedule_open" TEXT;
