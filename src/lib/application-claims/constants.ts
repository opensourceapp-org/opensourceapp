/** Client-safe claim status values (do not import Prisma enums in `"use client"` modules). */
export const ApplicationClaimStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApplicationClaimStatusValue =
  (typeof ApplicationClaimStatus)[keyof typeof ApplicationClaimStatus];
