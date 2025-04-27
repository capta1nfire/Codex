/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Step 1: Add the column, allowing NULLs temporarily
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Step 2: Update existing rows (using email prefix as username, ensure uniqueness if necessary)
-- Using SUBSTRING and POSITION to extract username part before '@'
-- Adding a fallback to the email itself if '@' is not present
-- NOTE: This assumes email prefixes are unique enough for existing users. 
-- If duplicates exist, this update might fail or require adjustment (e.g., appending part of the ID).
UPDATE "User" SET "username" = 
    CASE 
        WHEN POSITION('@' IN email) > 0 THEN SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)
        ELSE email
    END
WHERE "username" IS NULL;

-- Step 3: Now that existing rows have a value, make the column NOT NULL
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
