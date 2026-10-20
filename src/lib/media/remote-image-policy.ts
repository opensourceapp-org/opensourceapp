/** Whether to use a native img tag instead of next/image for a remote URL. */
export function shouldUseNativeImageTag(src: string): boolean {
  if (src.startsWith("data:")) return true;
  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "https:" && protocol !== "http:") return true;
    const allowedHosts = [
      "avatars.githubusercontent.com",
      "raw.githubusercontent.com",
      "gitlab.com",
      "codeberg.org",
    ];
    if (
      allowedHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))
    ) {
      return false;
    }
    if (hostname.endsWith(".githubusercontent.com")) return false;
    if (hostname.endsWith(".gitlab.io")) return false;
    return true;
  } catch {
    return true;
  }
}
