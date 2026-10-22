-- AlterTable
ALTER TABLE "Application" ADD COLUMN "screenshotUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "screenshotUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
