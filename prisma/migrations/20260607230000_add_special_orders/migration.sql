CREATE TYPE "SpecialOrderStatus" AS ENUM ('NEW', 'DONE', 'CANCELED');

CREATE TABLE "SpecialOrder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "SpecialOrderStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "answers" JSONB,
    "recommendedProductIds" JSONB,
    "baseProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "SpecialOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SpecialOrder_businessId_createdAt_idx" ON "SpecialOrder"("businessId", "createdAt");
CREATE INDEX "SpecialOrder_status_idx" ON "SpecialOrder"("status");

ALTER TABLE "SpecialOrder" ADD CONSTRAINT "SpecialOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpecialOrder" ADD CONSTRAINT "SpecialOrder_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
