-- AlterTable
ALTER TABLE "Application" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT;

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateIndex
CREATE INDEX "Application_publishedAt_deletedAt_idx" ON "Application"("publishedAt", "deletedAt");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
