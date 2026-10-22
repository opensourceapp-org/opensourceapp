import { z } from "zod";

export const videoUrlSchema = z
  .string()
  .trim()
  .max(2048, "Video URL is too long")
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid video URL (https://)" },
  )
  .optional()
  .or(z.literal(""));

export type VideoEmbedInfo =
  | {
      kind: "youtube" | "vimeo";
      embedUrl: string;
      watchUrl: string;
    }
  | {
      kind: "link";
      watchUrl: string;
    };

export function normalizeVideoUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function parseVideoEmbed(url: string): VideoEmbedInfo | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    if (!id) return { kind: "link", watchUrl: trimmed };
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = parsed.searchParams.get("v");
    if (v) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube.com/embed/${v}`,
        watchUrl: `https://www.youtube.com/watch?v=${v}`,
      };
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      const id = parts[embedIdx + 1];
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    }
    const shortsIdx = parts.indexOf("shorts");
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) {
      const id = parts[shortsIdx + 1];
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = parts.find((p) => /^\d+$/.test(p));
    if (id) {
      return {
        kind: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${id}`,
        watchUrl: `https://vimeo.com/${id}`,
      };
    }
  }

  if (parsed.protocol === "https:" || parsed.protocol === "http:") {
    return { kind: "link", watchUrl: trimmed };
  }

  return null;
}
