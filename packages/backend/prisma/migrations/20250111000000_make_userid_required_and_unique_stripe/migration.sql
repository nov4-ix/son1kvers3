-- Migration: Ensure userId is required and add unique constraint to stripeCustomerId
-- All generations must be associated with a user and counted against their tier

-- AlterTable: Ensure Generation.userId is NOT NULL (required)
-- This ensures all generations are associated with a user
-- Note: If there are any NULL values, they must be cleaned up first
UPDATE "generations" 
SET "userId" = 'system' 
WHERE "userId" IS NULL;

-- Now ensure the column is NOT NULL
ALTER TABLE "generations" 
ALTER COLUMN "userId" SET NOT NULL;

-- Ensure foreign key constraint uses CASCADE (delete generations when user is deleted)
ALTER TABLE "generations" DROP CONSTRAINT IF EXISTS "generations_userId_fkey";

ALTER TABLE "generations" 
ADD CONSTRAINT "generations_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "users" ("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- AlterTable: Add unique constraint to UserTier.stripeCustomerId
-- This prevents duplicate Stripe customer IDs
-- Step 1: Remove any potential duplicates (set to NULL if duplicate exists)
UPDATE "user_tiers" 
SET "stripeCustomerId" = NULL 
WHERE "stripeCustomerId" IN (
  SELECT "stripeCustomerId" 
  FROM "user_tiers" 
  WHERE "stripeCustomerId" IS NOT NULL 
  GROUP BY "stripeCustomerId" 
  HAVING COUNT(*) > 1
);

-- Step 2: Drop existing index if it exists (non-unique)
DROP INDEX IF EXISTS "user_tiers_stripeCustomerId_key";

-- Step 3: Create unique constraint/index
CREATE UNIQUE INDEX "user_tiers_stripeCustomerId_key" 
ON "user_tiers"("stripeCustomerId") 
WHERE "stripeCustomerId" IS NOT NULL;

-- Add comment to document the change (PostgreSQL)
COMMENT ON COLUMN "generations"."userId" IS 'Required user ID. All generations must be associated with a user and counted against their tier.';

