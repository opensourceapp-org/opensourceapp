const FETCH_TIMEOUT_MS = 5_000;
const MAX_HTML_BYTES = 120_000;

function resolveUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function parseIconFromHtml(html: string, pageUrl: string): string | null {
  const ogMatch =
    html.match(
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    );
  if (ogMatch?.[1]) {
    const resolved = resolveUrl(pageUrl, ogMatch[1].trim());
    if (resolved) return resolved;
  }

  const iconMatch =
    html.match(
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    );
  if (iconMatch?.[1]) {
    const resolved = resolveUrl(pageUrl, iconMatch[1].trim());
    if (resolved) return resolved;
  }

  try {
    return new URL("/favicon.ico", pageUrl).href;
  } catch {
    return null;
  }
}

/** Best-effort homepage icon (og:image, link icon, or /favicon.ico). */
export async function suggestHomepageIconUrl(
  homepageUrl: string | null | undefined,
): Promise<string | null> {
  if (!homepageUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(homepageUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  try {
    const res = await fetch(parsed.href, {
      headers: {
        Accept: "text/html",
        "User-Agent": "OpenSourceApp.org/1.0 (+https://opensourceapp.org)",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(
      buf.byteLength > MAX_HTML_BYTES
        ? buf.slice(0, MAX_HTML_BYTES)
        : buf,
    );
    return parseIconFromHtml(html, parsed.href);
  } catch {
    return null;
  }
}
