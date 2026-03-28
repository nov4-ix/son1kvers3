-- Migration: Make userId required and rename sunoId to generationTaskId
-- This migration ensures all generations are associated with a user
-- and renames the sunoId field to generationTaskId for consistency

-- Step 1: Ensure userId is NOT NULL (if not already)
-- First, handle any NULL values by assigning them to a system user or deleting them
-- Note: This assumes you have a system user or want to delete orphaned generations
-- Adjust this based on your data cleanup strategy

-- Option A: Delete orphaned generations (if any exist)
-- DELETE FROM "generations" WHERE "userId" IS NULL;

-- Option B: Assign to a system user (if you have one)
-- UPDATE "generations" SET "userId" = 'system-user-id' WHERE "userId" IS NULL;

-- For now, we'll just ensure the constraint exists
-- If there are NULL values, this will fail and you'll need to clean them up first

-- Step 2: Ensure userId column is NOT NULL
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'userId' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, ensure no NULL values exist
    -- If there are NULL values, you need to handle them first
    IF EXISTS (SELECT 1 FROM "generations" WHERE "userId" IS NULL) THEN
      RAISE EXCEPTION 'Cannot make userId NOT NULL: there are NULL values in generations table. Please clean them up first.';
    END IF;
    
    ALTER TABLE "generations" ALTER COLUMN "userId" SET NOT NULL;
  END IF;
END $$;

-- Step 3: Rename sunoId column to generationTaskId (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'sunoId'
  ) THEN
    ALTER TABLE "generations" RENAME COLUMN "sunoId" TO "generationTaskId";
  END IF;
END $$;

-- Step 4: Ensure generationTaskId column exists (if it doesn't exist yet)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'generationTaskId'
  ) THEN
    ALTER TABLE "generations" ADD COLUMN "generationTaskId" TEXT;
  END IF;
END $$;

-- Step 5: Ensure foreign key constraint uses CASCADE
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'generations_userId_fkey'
    AND table_name = 'generations'
  ) THEN
    ALTER TABLE "generations" DROP CONSTRAINT "generations_userId_fkey";
  END IF;
  
  -- Add constraint with CASCADE
  ALTER TABLE "generations" 
  ADD CONSTRAINT "generations_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users" ("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
END $$;

-- Step 6: Add comment to document the change
COMMENT ON COLUMN "generations"."userId" IS 'Required user ID. All generations must be associated with a user and counted against their tier.';
COMMENT ON COLUMN "generations"."generationTaskId" IS 'Task ID from the AI generation API (previously sunoId).';


