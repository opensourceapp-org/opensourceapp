type AuditMetadata = {
  from?: string;
  to?: string;
  submissionName?: string;
  submitterEmail?: string;
  submitterName?: string;
  messageSnippet?: string;
};

export function parseAuditMetadata(metadata: unknown): AuditMetadata {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as AuditMetadata;
}

export function auditStatusDetail(metadata: unknown): string | null {
  const m = parseAuditMetadata(metadata);
  if (m.from && m.to) return `${m.from} → ${m.to}`;
  return null;
}
