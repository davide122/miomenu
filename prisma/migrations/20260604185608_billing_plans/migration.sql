-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ALTRO',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeSubscriptionStatus" TEXT,
    "stripeCurrentPeriodEnd" DATETIME,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#111827',
    "themeMode" TEXT NOT NULL DEFAULT 'LIGHT',
    "visualStyle" TEXT NOT NULL DEFAULT 'MINIMAL',
    "fontStyle" TEXT NOT NULL DEFAULT 'INTER',
    "menuUi" JSONB,
    "screenUi" JSONB,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Business" ("address", "coverUrl", "createdAt", "fontStyle", "id", "instagram", "isActive", "logoUrl", "menuUi", "name", "ownerId", "primaryColor", "screenUi", "slug", "themeMode", "type", "updatedAt", "visualStyle", "whatsapp") SELECT "address", "coverUrl", "createdAt", "fontStyle", "id", "instagram", "isActive", "logoUrl", "menuUi", "name", "ownerId", "primaryColor", "screenUi", "slug", "themeMode", "type", "updatedAt", "visualStyle", "whatsapp" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
