import { describe, expect, it } from "vitest";
import {
  canUserSubmitClaim,
  isApplicationClaimable,
  userHasBlockingClaim,
} from "./claim-eligibility";

describe("isApplicationClaimable", () => {
  it("allows claim when no owner and published", () => {
    expect(
      isApplicationClaimable({ ownerId: null, deletedAt: null }),
    ).toBe(true);
  });

  it("blocks when owner assigned", () => {
    expect(
      isApplicationClaimable({ ownerId: "user-1", deletedAt: null }),
    ).toBe(false);
  });

  it("blocks when soft-deleted", () => {
    expect(
      isApplicationClaimable({
        ownerId: null,
        deletedAt: new Date(),
      }),
    ).toBe(false);
  });
});

describe("userHasBlockingClaim", () => {
  it("returns true when a pending claim exists", () => {
    expect(userHasBlockingClaim([{ status: "REJECTED" }, { status: "PENDING" }])).toBe(
      true,
    );
  });

  it("returns false when only terminal claims", () => {
    expect(
      userHasBlockingClaim([{ status: "REJECTED" }, { status: "APPROVED" }]),
    ).toBe(false);
  });
});

describe("canUserSubmitClaim", () => {
  it("blocks duplicate pending claims", () => {
    const result = canUserSubmitClaim({
      application: { ownerId: null, deletedAt: null },
      userId: "u1",
      userClaims: [{ status: "PENDING" }],
    });
    expect(result.ok).toBe(false);
  });

  it("allows when eligible", () => {
    const result = canUserSubmitClaim({
      application: { ownerId: null, deletedAt: null },
      userId: "u1",
      userClaims: [{ status: "REJECTED" }],
    });
    expect(result).toEqual({ ok: true });
  });
});
