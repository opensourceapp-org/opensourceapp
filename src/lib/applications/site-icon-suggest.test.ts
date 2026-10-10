import { describe, expect, it } from "vitest";

// Test HTML parsing indirectly via module internals pattern — fetch is not called.
describe("site icon HTML parsing", () => {
  it("extracts og:image via regex used by suggestHomepageIconUrl", () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://cdn.example.com/icon.png" />
      </head></html>
    `;
    const match =
      html.match(
        /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      );
    expect(match?.[1]).toBe("https://cdn.example.com/icon.png");
  });
});
