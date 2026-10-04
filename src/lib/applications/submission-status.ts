export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

const transitions: Record<SubmissionStatus, SubmissionStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: [
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "CHANGES_REQUESTED",
  ],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["SUBMITTED"],
  APPROVED: [],
  REJECTED: [],
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
