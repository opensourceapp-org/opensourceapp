import type { VerificationSignalType } from "@/generated/prisma";

export type SignalDisplay = {
  type: VerificationSignalType;
  label: string;
  description: string;
};

const SIGNAL_COPY: Partial<
  Record<VerificationSignalType, { label: string; description: string }>
> = {
  SOURCE_REPOSITORY: {
    label: "Source repository",
    description: "Repository is publicly accessible",
  },
  LICENSE: {
    label: "License",
    description: "Open-source license identified",
  },
  REPO_ACTIVITY: {
    label: "Repository activity",
    description: "Recent repository activity detected",
  },
  RELEASE: {
    label: "Latest release",
    description: "A public release was detected",
  },
  REPOSITORY_OWNERSHIP: {
    label: "Repository ownership",
    description: "Verified via .opensourceapp/verification",
  },
  MAINTAINER: {
    label: "Maintainer",
    description: "Maintainer identity verified",
  },
  MAINTAINER_ATTESTED: {
    label: "Maintainer",
    description: "Maintainer attestation on file",
  },
  DOMAIN: {
    label: "Official website",
    description: "Website ownership verified",
  },
  PACKAGE_REGISTRY: {
    label: "Package registry",
    description: "Listed on a public package registry",
  },
  SECURITY_AUDIT: {
    label: "Security review",
    description: "Independent security signal recorded",
  },
  COMMUNITY_ENDORSEMENT: {
    label: "Community",
    description: "Community endorsement recorded",
  },
};

export function signalDisplay(
  type: VerificationSignalType,
  summary?: string,
): SignalDisplay {
  const copy = SIGNAL_COPY[type];
  return {
    type,
    label: copy?.label ?? type.replace(/_/g, " ").toLowerCase(),
    description: summary?.trim() || copy?.description || "",
  };
}

export function hasActiveLicenseSignal(
  signals: { type: VerificationSignalType; status: string }[],
): boolean {
  return signals.some((s) => s.status === "ACTIVE" && s.type === "LICENSE");
}

export function hasMaintainerSignal(
  signals: { type: VerificationSignalType; status: string }[],
): boolean {
  return signals.some(
    (s) =>
      s.status === "ACTIVE" &&
      (s.type === "MAINTAINER" || s.type === "MAINTAINER_ATTESTED"),
  );
}
