-- DropIndex
DROP INDEX "User_apiKey_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiKeyPrefix" TEXT;

-- CreateIndex
CREATE INDEX "User_apiKeyPrefix_idx" ON "User"("apiKeyPrefix");
