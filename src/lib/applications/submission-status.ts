export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "DELETED";

const transitions: Record<SubmissionStatus, SubmissionStatus[]> = {
  DRAFT: ["SUBMITTED", "DELETED"],
  SUBMITTED: [
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "CHANGES_REQUESTED",
    "DELETED",
  ],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CHANGES_REQUESTED", "DELETED"],
  CHANGES_REQUESTED: ["SUBMITTED", "DELETED"],
  APPROVED: ["DELETED"],
  REJECTED: ["DELETED"],
  DELETED: [],
};

export function canTransitionSubmission(
  from: SubmissionStatus,
  to: SubmissionStatus,
): boolean {
  if (from === to) return false;
  return transitions[from]?.includes(to) ?? false;
}

export function assertSubmissionTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): void {
  if (!canTransitionSubmission(from, to)) {
    throw new Error(`Invalid submission transition: ${from} → ${to}`);
  }
}

export const moderatorTransitions: SubmissionStatus[] = [
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
];
