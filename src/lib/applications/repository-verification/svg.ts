import DOMPurify from "isomorphic-dompurify";

const MAX_SVG_BYTES = 256 * 1024;

export function sanitizeAppSvg(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (Buffer.byteLength(trimmed, "utf8") > MAX_SVG_BYTES) {
    return null;
  }
  if (!/<svg[\s>]/i.test(trimmed)) {
    return null;
  }

  const clean = DOMPurify.sanitize(trimmed, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["svg"],
    FORBID_TAGS: ["script", "foreignObject"],
    FORBID_ATTR: ["onload", "onclick", "onerror", "href"],
  });

  if (!/<svg[\s>]/i.test(clean)) {
    return null;
  }
  return clean;
}
