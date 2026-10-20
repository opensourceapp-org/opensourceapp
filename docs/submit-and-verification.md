# Submit flow and repository verification

## `.opensourceapp/` in your repository

When you submit an app, you can prove ownership and supply branding assets from files in your repo:

| Path | Purpose |
| --- | --- |
| `.opensourceapp/verification` | Single-line file containing your verification token (required for ownership verification). |
| `.opensourceapp/app.svg` | Optional SVG app icon (sanitized on import; takes priority over logo URLs when published). |
| `.opensourceapp/screenshots/` | Optional folder of screenshot images (PNG, JPEG, WebP, or GIF). |

After you click **Verify repository**, we read the verification file, import `app.svg` if present, and discover images under `.opensourceapp/screenshots/` on the default branch. Discovered screenshot URLs are merged with any HTTPS screenshot URLs you entered on the submit form (up to 10 total).

Screenshots appear on the public app detail page in a **Screenshots** tab with an accessible carousel.
