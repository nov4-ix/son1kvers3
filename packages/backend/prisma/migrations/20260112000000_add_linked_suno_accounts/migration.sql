-- Migration: Add LinkedSunoAccount table and update Token for harvester
-- This enables the TokenHarvester system to auto-collect tokens from linked Suno accounts

-- CreateTable: linked_suno_accounts
CREATE TABLE IF NOT EXISTS "linked_suno_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "sessionCookies" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "lastHarvest" DATETIME,
    "tokensCollected" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "linked_suno_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: Unique constraint on userId + email combination
CREATE UNIQUE INDEX "linked_suno_accounts_userId_email_key" ON "linked_suno_accounts"("userId", "email");

-- CreateIndex: Optimize queries for active accounts and harvesting
CREATE INDEX "linked_suno_accounts_isActive_lastHarvest_idx" ON "linked_suno_accounts"("isActive", "lastHarvest");

-- AlterTable: tokens - Add harvester fields
-- Adding source field
ALTER TABLE "tokens" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';

-- Adding poolPriority field
ALTER TABLE "tokens" ADD COLUMN "poolPriority" INTEGER NOT NULL DEFAULT 3;

-- Adding linkedAccountId field
ALTER TABLE "tokens" ADD COLUMN "linkedAccountId" TEXT;

-- Add foreign key constraint for linkedAccountId
-- Note: SQLite doesn't support adding foreign keys to existing tables
-- This will be handled by Prisma's db push or by recreating the table

-- CreateIndex: Optimize token pool queries
CREATE INDEX IF NOT EXISTS "tokens_poolPriority_usageCount_isActive_isValid_idx" ON "tokens"("poolPriority", "usageCount", "isActive", "isValid");

-- CreateIndex: Optimize token source queries
CREATE INDEX IF NOT EXISTS "tokens_source_tier_idx" ON "tokens"("source", "tier");

-- Add comments to document the changes
-- Note: SQLite doesn't support COMMENT ON, but this documents the schema
