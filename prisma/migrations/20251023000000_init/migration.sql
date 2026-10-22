-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'DELETED');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SoftwareStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationSignalType" AS ENUM ('MAINTAINER_ATTESTED', 'REPO_ACTIVITY', 'PACKAGE_REGISTRY', 'SECURITY_AUDIT', 'COMMUNITY_ENDORSEMENT', 'SOURCE_REPOSITORY', 'LICENSE', 'RELEASE', 'MAINTAINER', 'DOMAIN', 'REPOSITORY_OWNERSHIP');

-- CreateEnum
CREATE TYPE "VerificationSignalStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ApplicationClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CategoryStatus" NOT NULL DEFAULT 'APPROVED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spdxId" TEXT,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "repositoryUrl" TEXT NOT NULL,
    "repositoryHost" TEXT,
    "defaultBranch" TEXT,
    "stars" INTEGER,
    "forks" INTEGER,
    "openIssuesCount" INTEGER,
    "lastCommitAt" TIMESTAMP(3),
    "primaryLanguage" TEXT,
    "logoUrl" TEXT,
    "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "latestReleaseTag" TEXT,
    "latestReleaseAt" TIMESTAMP(3),
    "latestReleaseUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedById" TEXT,
    "ownerId" TEXT,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCategory" (
    "applicationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ApplicationCategory_pkey" PRIMARY KEY ("applicationId","categoryId")
);

-- CreateTable
CREATE TABLE "ApplicationSoftware" (
    "applicationId" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,

    CONSTRAINT "ApplicationSoftware_pkey" PRIMARY KEY ("applicationId","softwareId")
);

-- CreateTable
CREATE TABLE "ApplicationPlatform" (
    "applicationId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "ApplicationPlatform_pkey" PRIMARY KEY ("applicationId","platformId")
);

-- CreateTable
CREATE TABLE "ApplicationLicense" (
    "applicationId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,

    CONSTRAINT "ApplicationLicense_pkey" PRIMARY KEY ("applicationId","licenseId")
);

-- CreateTable
CREATE TABLE "ApplicationTag" (
    "applicationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ApplicationTag_pkey" PRIMARY KEY ("applicationId","tagId")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "repositoryUrl" TEXT NOT NULL,
    "normalizedRepositoryUrl" TEXT,
    "repositoryHost" TEXT,
    "defaultBranch" TEXT,
    "stars" INTEGER,
    "forks" INTEGER,
    "lastCommitAt" TIMESTAMP(3),
    "primaryLanguage" TEXT,
    "repoMetadataJson" JSONB,
    "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "reviewerNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "VerificationSignal" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "VerificationSignalType" NOT NULL,
    "status" "VerificationSignalStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "evidenceJson" JSONB,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "VerificationSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'footer',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Software_slug_key" ON "Software"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "License_slug_key" ON "License"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Application_slug_key" ON "Application"("slug");

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateIndex
CREATE INDEX "Application_ownerId_idx" ON "Application"("ownerId");

-- CreateIndex
CREATE INDEX "Application_publishedAt_deletedAt_idx" ON "Application"("publishedAt", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_applicationId_key" ON "Submission"("applicationId");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_normalizedRepositoryUrl_idx" ON "Submission"("normalizedRepositoryUrl");

-- CreateIndex
CREATE INDEX "ApplicationClaim_status_createdAt_idx" ON "ApplicationClaim"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationClaim_applicationId_idx" ON "ApplicationClaim"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationClaim_userId_idx" ON "ApplicationClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryVerification_submissionId_key" ON "RepositoryVerification"("submissionId");

-- CreateIndex
CREATE INDEX "RepositoryVerification_userId_idx" ON "RepositoryVerification"("userId");

-- CreateIndex
CREATE INDEX "VerificationSignal_applicationId_idx" ON "VerificationSignal"("applicationId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Software" ADD CONSTRAINT "Software_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCategory" ADD CONSTRAINT "ApplicationCategory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCategory" ADD CONSTRAINT "ApplicationCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSoftware" ADD CONSTRAINT "ApplicationSoftware_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSoftware" ADD CONSTRAINT "ApplicationSoftware_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPlatform" ADD CONSTRAINT "ApplicationPlatform_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPlatform" ADD CONSTRAINT "ApplicationPlatform_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLicense" ADD CONSTRAINT "ApplicationLicense_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLicense" ADD CONSTRAINT "ApplicationLicense_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTag" ADD CONSTRAINT "ApplicationTag_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTag" ADD CONSTRAINT "ApplicationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "ApplicationClaim" ADD CONSTRAINT "ApplicationClaim_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationClaim" ADD CONSTRAINT "ApplicationClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationClaim" ADD CONSTRAINT "ApplicationClaim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryVerification" ADD CONSTRAINT "RepositoryVerification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryVerification" ADD CONSTRAINT "RepositoryVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSignal" ADD CONSTRAINT "VerificationSignal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSignal" ADD CONSTRAINT "VerificationSignal_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
