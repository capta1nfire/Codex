-- CreateEnum
CREATE TYPE "StudioConfigType" AS ENUM ('PLACEHOLDER', 'TEMPLATE', 'GLOBAL');

-- CreateTable
CREATE TABLE "StudioConfig" (
    "id" TEXT NOT NULL,
    "type" "StudioConfigType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioConfig_type_isActive_idx" ON "StudioConfig"("type", "isActive");

-- CreateIndex
CREATE INDEX "StudioConfig_createdById_idx" ON "StudioConfig"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "StudioConfig_type_templateType_key" ON "StudioConfig"("type", "templateType");

-- AddForeignKey
ALTER TABLE "StudioConfig" ADD CONSTRAINT "StudioConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
