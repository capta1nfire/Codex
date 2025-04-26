-- CreateIndex
CREATE INDEX "User_apiKeyPrefix_isActive_idx" ON "User"("apiKeyPrefix", "isActive");
