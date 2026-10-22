# Application claims

Maintainers can claim listings that have no verified owner (for example bulk-imported apps).

## Flow (matches app submission verification)

1. Open **Claim this listing** on the app page.
2. A pending claim is created and a **verification token** is generated (stored hashed on `ApplicationClaim.tokenHash`, same pattern as `RepositoryVerification` on submissions).
3. In the listing’s **source repository**, create `.opensourceapp/verification` containing only that token (optional: `.opensourceapp/app.svg` for icon preview).
4. Click **Verify repository**.
5. Optionally add a note for moderators.
6. An admin approves or rejects the claim at `/admin/claims`.

Approved claims set `Application.ownerId` and may record a repository ownership verification signal.
