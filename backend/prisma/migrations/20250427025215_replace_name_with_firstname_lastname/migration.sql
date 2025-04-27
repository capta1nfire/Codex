/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add new columns (nullable for now)
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- Step 2: Populate new columns from existing 'name'
-- Split 'name' by the first space. Everything before is firstName, everything after is lastName.
-- If no space, entire 'name' goes to firstName.
UPDATE "User" SET 
    "firstName" = CASE 
        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM 1 FOR POSITION(' ' IN name) - 1)
        ELSE name
    END,
    "lastName" = CASE 
        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE NULL
    END;

-- Step 3: Make firstName NOT NULL (now that it's populated)
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;

-- Step 4: Drop the old 'name' column
ALTER TABLE "User" DROP COLUMN "name";

-- Step 5: Update existing usernames to avoid conflicts with future user choices
-- Set them to 'user_' followed by their ID to ensure uniqueness for now.
UPDATE "User" SET "username" = 'user_' || id;

-- Note: The UNIQUE constraint on 'username' is already defined in the schema and was created
-- in the previous migration (20250427023725). We just cleaned up the existing values here.
