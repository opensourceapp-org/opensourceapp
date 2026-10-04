"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { detectRepoHost, repoHostLabel } from "@/lib/repo-host";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RepositoryBadge } from "@/components/badges/repository-badge";
import {
  createSubmissionFromRepoAction,
  fetchRepoMetadataAction,
} from "@/server/actions/submissions";
import {
  isSubmissionFieldErrors,
  submissionErrorStep,
  submissionFieldErrorSummary,
  type SubmissionFieldErrors,
} from "@/lib/validation/submission-errors";
import { cn } from "@/lib/utils";

const STEPS = ["Repository", "Details", "Confirm"] as const;

type LicenseOption = { slug: string; name: string; spdxId: string | null };

type RepoMetadataWithLicense = {
  name: string;
  description: string | null;
  homepageUrl: string | null;
  primaryLanguage: string | null;
  licenseSlug?: string | null;
};

function FieldError({
  id,
  messages,
}: {
  id?: string;
  messages?: string[];
}) {
  const message = messages?.[0];
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function ValidationSummary({ fieldErrors }: { fieldErrors: SubmissionFieldErrors }) {
  const lines = submissionFieldErrorSummary(fieldErrors);
  if (lines.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
      role="alert"
    >
      <p className="font-medium text-destructive">Please fix the following:</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-destructive">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function isAutoFetchableRepoUrl(url: string): boolean {
  const host = detectRepoHost(url);
  if (host !== "github" && host !== "gitlab") return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

export function SubmitForm({ licenses }: { licenses: LicenseOption[] }) {
  const [step, setStep] = useState(0);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [licenseSlug, setLicenseSlug] = useState("");
  const [metadataConfirmed, setMetadataConfirmed] = useState(false);
  const [repoMetadata, setRepoMetadata] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SubmissionFieldErrors>({});
  const [pending, startTransition] = useTransition();
  const lastFetchedUrlRef = useRef("");

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  function applyActionError(err: unknown) {
    if (isSubmissionFieldErrors(err)) {
      setFieldErrors(err);
      setError(null);
      setStep(submissionErrorStep(err));
      return;
    }
    setFieldErrors({});
    setError(typeof err === "string" ? err : "Something went wrong. Try again.");
  }

  const host = repositoryUrl ? detectRepoHost(repositoryUrl) : null;

  function applyFetchedMetadata(data: RepoMetadataWithLicense) {
    setRepoMetadata(data);
    setName(data.name);
    setDescription(data.description ?? "");
    setHomepageUrl(data.homepageUrl ?? "");
    setPrimaryLanguage(data.primaryLanguage ?? "");
    if (data.licenseSlug) {
      setLicenseSlug(data.licenseSlug);
    }
    setMetadataConfirmed(false);
  }

  function fetchMetadata(advanceToDetails: boolean) {
    clearErrors();
    startTransition(async () => {
      const res = await fetchRepoMetadataAction(repositoryUrl);
      if (res.error) {
        setError(res.error);
        return;
      }
      const data = res.data!;
      lastFetchedUrlRef.current = repositoryUrl;
      applyFetchedMetadata(data);
      if (advanceToDetails) {
        setStep(1);
      }
    });
  }

  useEffect(() => {
    if (!isAutoFetchableRepoUrl(repositoryUrl)) return;
    if (repositoryUrl === lastFetchedUrlRef.current) return;

    const timer = window.setTimeout(() => {
      if (repositoryUrl === lastFetchedUrlRef.current) return;
      startTransition(async () => {
        const res = await fetchRepoMetadataAction(repositoryUrl);
        if (res.error) return;
        const data = res.data!;
        lastFetchedUrlRef.current = repositoryUrl;
        applyFetchedMetadata(data);
        setStep(1);
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [repositoryUrl]);

  function save(submit: boolean) {
    clearErrors();
    const mergedMetadata = {
      ...(repoMetadata && typeof repoMetadata === "object"
        ? (repoMetadata as Record<string, unknown>)
        : {}),
      licenseSlug: licenseSlug || undefined,
    };
    startTransition(async () => {
      const res = await createSubmissionFromRepoAction(
        repositoryUrl,
        mergedMetadata,
        {
          name,
          tagline,
          description,
          homepageUrl,
          primaryLanguage,
          licenseSlug,
          submit,
        },
      );
      if (res.error) {
        applyActionError(res.error);
        return;
      }
      window.location.href = "/dashboard";
    });
  }

  const selectedLicense = licenses.find((l) => l.slug === licenseSlug);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <nav aria-label="Progress" className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                "h-1 rounded-full",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-xs",
                i === step ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </nav>

      {step === 0 && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h2 className="font-display text-xl font-medium">Repository URL</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a GitHub or GitLab URL — we fetch metadata and detect the
              open-source license automatically.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repositoryUrl">Source repository</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="repositoryUrl"
                value={repositoryUrl}
                onChange={(e) => {
                  const next = e.target.value;
                  setRepositoryUrl(next);
                  if (next !== lastFetchedUrlRef.current) {
                    setRepoMetadata(null);
                  }
                }}
                placeholder="https://github.com/org/project"
                aria-invalid={Boolean(fieldErrors.repositoryUrl)}
                aria-describedby={
                  fieldErrors.repositoryUrl ? "repositoryUrl-error" : undefined
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fetchMetadata(true)}
                disabled={pending || !repositoryUrl}
              >
                {pending ? "Fetching…" : "Fetch metadata"}
              </Button>
            </div>
            {pending && isAutoFetchableRepoUrl(repositoryUrl) && (
              <p className="text-xs text-muted-foreground">
                Fetching repository metadata and license…
              </p>
            )}
            {host && host !== "other" && (
              <RepositoryBadge url={repositoryUrl} />
            )}
            {licenseSlug && step === 0 && (
              <p className="text-xs text-muted-foreground">
                Detected license:{" "}
                <span className="font-medium text-foreground">
                  {selectedLicense?.name ?? licenseSlug}
                </span>
              </p>
            )}
            {host === "other" && repositoryUrl && (
              <p className="text-xs text-muted-foreground">
                Supported hosts: GitHub, GitLab, Codeberg. Other URLs may still
                work if metadata is reachable.
              </p>
            )}
            <FieldError
              id="repositoryUrl-error"
              messages={fieldErrors.repositoryUrl}
            />
          </div>
          {Object.keys(fieldErrors).length > 0 && step === 0 && (
            <ValidationSummary fieldErrors={fieldErrors} />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </section>
      )}

      {step === 1 && repoMetadata !== null && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h2 className="font-display text-xl font-medium">Listing details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit anything that should appear on the public directory page.
            </p>
          </div>
          {Object.keys(fieldErrors).length > 0 && (
            <ValidationSummary fieldErrors={fieldErrors} />
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={Boolean(fieldErrors.name)}
              />
              <FieldError messages={fieldErrors.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                aria-invalid={Boolean(fieldErrors.tagline)}
              />
              <FieldError messages={fieldErrors.tagline} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
                aria-invalid={Boolean(fieldErrors.description)}
              />
              <FieldError messages={fieldErrors.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseSlug">Open-source license</Label>
              <select
                id="licenseSlug"
                value={licenseSlug}
                onChange={(e) => setLicenseSlug(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-invalid={Boolean(fieldErrors.licenseSlug)}
              >
                <option value="">Select a license (optional)</option>
                {licenses.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                    {l.spdxId ? ` (${l.spdxId})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Pre-filled from the repository when we can match it to our
                license list.
              </p>
              <FieldError messages={fieldErrors.licenseSlug} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="homepageUrl">Homepage</Label>
                <Input
                  id="homepageUrl"
                  value={homepageUrl}
                  onChange={(e) => setHomepageUrl(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.homepageUrl)}
                />
                <FieldError messages={fieldErrors.homepageUrl} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryLanguage">Primary language</Label>
                <Input
                  id="primaryLanguage"
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.primaryLanguage)}
                />
                <FieldError messages={fieldErrors.primaryLanguage} />
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h2 className="font-display text-xl font-medium">Confirm & submit</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Save a draft to finish later, or send for moderator review.
            </p>
          </div>
          <dl className="space-y-2 rounded-lg bg-surface-muted p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Repository</dt>
              <dd className="truncate font-mono text-xs">{repositoryUrl}</dd>
            </div>
            {selectedLicense && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">License</dt>
                <dd>{selectedLicense.name}</dd>
              </div>
            )}
            {host && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Host</dt>
                <dd>{repoHostLabel(host)}</dd>
              </div>
            )}
          </dl>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={metadataConfirmed}
              onCheckedChange={(v) => setMetadataConfirmed(v === true)}
              className="mt-0.5"
            />
            <span>I confirm this information is accurate and I have rights to
              submit this listing.</span>
          </label>
          {Object.keys(fieldErrors).length > 0 && (
            <ValidationSummary fieldErrors={fieldErrors} />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!metadataConfirmed || pending}
                onClick={() => save(false)}
              >
                Save draft
              </Button>
              <Button
                type="button"
                disabled={!metadataConfirmed || pending}
                onClick={() => save(true)}
              >
                Submit for review
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
