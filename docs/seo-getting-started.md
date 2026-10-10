# SEO getting started (OpenSourceApp)

Technical SEO on this site (metadata, sitemap, structured data, branding) helps search engines understand **OpenSourceApp** as a named brand. It does **not** guarantee any particular ranking or that Google will stop rewriting queries.

## What we optimize for

- **Branded queries** — e.g. `opensourceapp`, `OpenSourceApp`, `OpenSourceApp.org` — where the site should be the obvious result once Google has indexed and trusted the domain.
- **Generic queries** — e.g. `open source app` — compete with GitHub, F-Droid, Wikipedia, and long-established directories. Expect slow progress without strong backlinks and consistent mentions of the brand.

## Google Search Console

1. Sign in at [Google Search Console](https://search.google.com/search-console).
2. Add the **URL-prefix** or **Domain** property for `https://opensourceapp.org`.
3. Verify ownership (DNS TXT record is the most stable for a domain property).
4. Submit the sitemap: `https://opensourceapp.org/sitemap.xml` (also listed in `/robots.txt`).
5. Use **URL Inspection** on the homepage after deploys to confirm Google sees `index` (not `noindex`) and the expected title/description.

## Production checklist

- Set `AUTH_URL=https://opensourceapp.org` in production (used for canonical URLs, sitemap, Open Graph, and JSON-LD).
- Confirm `robots.txt` allows `/` and disallows private areas (`/admin`, `/dashboard`, `/submit`).
- After major SEO changes, request indexing for `/` once in Search Console — avoid repeated spammy recrawl requests.

## Branded vs rewritten queries

If Google shows results for **“open source app”** when the user typed **“opensourceapp”**, that is query rewriting and relevance competition, not necessarily a misconfigured site. Improving branded visibility still helps:

- Use **OpenSourceApp** consistently in titles, headings, and footer (already reflected in the app).
- Link to `https://opensourceapp.org` from READMEs, launch posts, and profiles using the brand name as anchor text where natural.
- Ensure social shares use the correct domain so Open Graph/Twitter metadata reinforce the brand.

## Patience and backlinks

New or low-authority domains rarely rank #1 for ambiguous terms overnight. Sustainable signals:

- Mentions and links from relevant open-source communities and project pages.
- Regular publishing of useful public pages (app listings, categories) via the directory itself.
- Monitoring Search Console **Performance** for impressions/clicks on queries containing `opensourceapp` over weeks and months.

No SEO change on the codebase replaces verification in Search Console and real-world links to the domain.
