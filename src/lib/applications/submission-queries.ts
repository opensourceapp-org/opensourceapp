import { SubmissionStatus } from "@/generated/prisma";

/** Submissions visible to owners on the dashboard (excludes soft-deleted). */
export const visibleSubmissionStatuses: SubmissionStatus[] = [
  SubmissionStatus.DRAFT,
  SubmissionStatus.SUBMITTED,
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.APPROVED,
  SubmissionStatus.REJECTED,
  SubmissionStatus.CHANGES_REQUESTED,
];

export const moderationQueueStatuses: SubmissionStatus[] = [
  SubmissionStatus.SUBMITTED,
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.CHANGES_REQUESTED,
];
