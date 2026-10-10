"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModeratorFeedbackBanner } from "@/components/moderator-feedback-banner";
import { AppIcon } from "@/components/app-icon";
import {
  logoUrlFromSubmissionMetadata,
  explicitLogoUrlFromRepoMetadata,
} from "@/lib/applications/logo-url";
import { licenseSlugFromRepoMetadataJson } from "@/lib/applications/repo-metadata";
import { saveSubmissionAction } from "@/server/actions/submissions";
import {
  isSubmissionFieldErrors,
  submissionFieldErrorSummary,
  type SubmissionFieldErrors,
} from "@/lib/validation/submission-errors";

type LicenseOption = { slug: string; name: string; spdxId: string | null };

type EditSubmissionFormProps = {
  licenses: LicenseOption[];
  submission: {
    id: string;
    status: string;
    name: string;
    tagline: string | null;
    description: string;
    homepageUrl: string | null;
    repositoryUrl: string;
    primaryLanguage: string | null;
    reviewerNotes: string | null;
    repoMetadataJson: unknown;
  };
};

export function EditSubmissionForm({
  licenses,
  submission,
}: EditSubmissionFormProps) {
  const [name, setName] = useState(submission.name);
  const [tagline, setTagline] = useState(submission.tagline ?? "");
  const [description, setDescription] = useState(submission.description);
  const [homepageUrl, setHomepageUrl] = useState(submission.homepageUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(
    () =>
      explicitLogoUrlFromRepoMetadata(submission.repoMetadataJson) ??
      logoUrlFromSubmissionMetadata(submission.repoMetadataJson) ??
      "",
  );
  const [primaryLanguage, setPrimaryLanguage] = useState(
    submission.primaryLanguage ?? "",
  );
  const [licenseSlug, setLicenseSlug] = useState(
    () => licenseSlugFromRepoMetadataJson(submission.repoMetadataJson) ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SubmissionFieldErrors>({});
  const [pending, startTransition] = useTransition();

  const isResubmit = submission.status === "CHANGES_REQUESTED";

  function save(submit: boolean) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await saveSubmissionAction(
        {
          name,
          tagline,
          description,
          homepageUrl,
          logoUrl,
          repositoryUrl: submission.repositoryUrl,
          primaryLanguage,
          licenseSlug,
          repoMetadataJson: submission.repoMetadataJson,
          submit,
        },
        submission.id,
      );
      if (res.error) {
        if (isSubmissionFieldErrors(res.error)) {
          setFieldErrors(res.error);
          return;
        }
        setError(typeof res.error === "string" ? res.error : "Could not save");
        return;
      }
      window.location.href = "/dashboard";
    });
  }

  const summaryLines = submissionFieldErrorSummary(fieldErrors);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {isResubmit && submission.reviewerNotes && (
        <ModeratorFeedbackBanner
          status={submission.status}
          message={submission.reviewerNotes}
        />
      )}

      {summaryLines.length > 0 && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <p className="font-medium text-destructive">Please fix the following:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-destructive">
            {summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <div>
          <h2 className="font-display text-xl font-medium">Listing details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Repository:{" "}
            <span className="font-mono text-xs">{submission.repositoryUrl}</span>
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <AppIcon
              name={name || submission.name}
              logoUrl={logoUrl.trim() || logoUrlFromSubmissionMetadata(submission.repoMetadataJson)}
              size="lg"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="logoUrl">App icon URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
              />
              <p className="text-xs text-muted-foreground">
                Optional image URL for your listing icon.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseSlug">Open-source license</Label>
            <select
              id="licenseSlug"
              value={licenseSlug}
              onChange={(e) => setLicenseSlug(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a license (optional)</option>
              {licenses.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                  {l.spdxId ? ` (${l.spdxId})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="homepageUrl">Homepage</Label>
              <Input
                id="homepageUrl"
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryLanguage">Primary language</Label>
              <Input
                id="primaryLanguage"
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {!isResubmit && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => save(false)}
            >
              Save draft
            </Button>
          )}
          <Button
            type="button"
            disabled={pending}
            onClick={() => save(true)}
          >
            {isResubmit ? "Resubmit for review" : "Submit for review"}
          </Button>
        </div>
      </section>
    </div>
  );
}
