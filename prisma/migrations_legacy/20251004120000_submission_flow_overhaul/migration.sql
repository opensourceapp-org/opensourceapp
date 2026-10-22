-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SoftwareStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'DELETED';

-- AlterEnum
ALTER TYPE "VerificationSignalType" ADD VALUE 'REPOSITORY_OWNERSHIP';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "status" "CategoryStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "normalizedRepositoryUrl" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- CreateTable
CREATE TABLE "Software" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "status" "SoftwareStatus" NOT NULL DEFAULT 'APPROVED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSoftware" (
    "applicationId" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,

    CONSTRAINT "ApplicationSoftware_pkey" PRIMARY KEY ("applicationId","softwareId")
);

-- CreateTable
CREATE TABLE "SubmissionCategory" (
    "submissionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "SubmissionCategory_pkey" PRIMARY KEY ("submissionId","categoryId")
);

-- CreateTable
CREATE TABLE "SubmissionSoftware" (
    "submissionId" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,

    CONSTRAINT "SubmissionSoftware_pkey" PRIMARY KEY ("submissionId","softwareId")
);

-- CreateTable
CREATE TABLE "RepositoryVerification" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "logoSvgSanitized" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Software_slug_key" ON "Software"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryVerification_submissionId_key" ON "RepositoryVerification"("submissionId");

-- CreateIndex
CREATE INDEX "RepositoryVerification_userId_idx" ON "RepositoryVerification"("userId");

-- CreateIndex
CREATE INDEX "Submission_normalizedRepositoryUrl_idx" ON "Submission"("normalizedRepositoryUrl");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Software" ADD CONSTRAINT "Software_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSoftware" ADD CONSTRAINT "ApplicationSoftware_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSoftware" ADD CONSTRAINT "ApplicationSoftware_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionCategory" ADD CONSTRAINT "SubmissionCategory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionCategory" ADD CONSTRAINT "SubmissionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionSoftware" ADD CONSTRAINT "SubmissionSoftware_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionSoftware" ADD CONSTRAINT "SubmissionSoftware_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryVerification" ADD CONSTRAINT "RepositoryVerification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryVerification" ADD CONSTRAINT "RepositoryVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
