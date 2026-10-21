-- CreateEnum
CREATE TYPE "ApplicationClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "ownerId" TEXT;

-- CreateTable
CREATE TABLE "ApplicationClaim" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationClaimStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceMessage" TEXT,
    "evidenceUrl" TEXT,
    "tokenHash" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "logoSvgSanitized" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "reviewerNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_ownerId_idx" ON "Application"("ownerId");

-- CreateIndex
CREATE INDEX "ApplicationClaim_status_createdAt_idx" ON "ApplicationClaim"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationClaim_applicationId_idx" ON "ApplicationClaim"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationClaim_userId_idx" ON "ApplicationClaim"("userId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationClaim" ADD CONSTRAINT "ApplicationClaim_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationClaim" ADD CONSTRAINT "ApplicationClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationClaim" ADD CONSTRAINT "ApplicationClaim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
