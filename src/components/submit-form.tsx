"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { detectRepoHost, repoHostLabel } from "@/lib/repo-host";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RepositoryBadge } from "@/components/badges/repository-badge";
import { EntitySearchCombobox, type EntityOption } from "@/components/entity-search-combobox";
import { RepositoryVerificationPanel } from "@/components/repository-verification-panel";
import {
  createPendingCategoryAction,
  searchCategoriesAction,
} from "@/server/actions/categories";
import {
  createPendingSoftwareAction,
  searchSoftwareAction,
} from "@/server/actions/software";
import {
  ensureSubmissionDraftAction,
  fetchRepoMetadataAction,
  saveSubmissionAction,
} from "@/server/actions/submissions";
import {
  isSubmissionFieldErrors,
  submissionErrorStep,
  submissionFieldErrorSummary,
  type SubmissionFieldErrors,
} from "@/lib/validation/submission-errors";
import { cn } from "@/lib/utils";

const STEPS = ["App info", "Categories", "Verification", "Review"] as const;

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

export function SubmitForm({
  licenses,
  initialSubmissionId,
}: {
  licenses: LicenseOption[];
  initialSubmissionId?: string;
}) {
  const [step, setStep] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(
    initialSubmissionId ?? null,
  );
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [licenseSlug, setLicenseSlug] = useState("");
  const [categories, setCategories] = useState<EntityOption[]>([]);
  const [alternatives, setAlternatives] = useState<EntityOption[]>([]);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [metadataConfirmed, setMetadataConfirmed] = useState(false);
  const [repoMetadata, setRepoMetadata] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SubmissionFieldErrors>({});
  const [pending, startTransition] = useTransition();
  const lastFetchedUrlRef = useRef("");

  const searchCategories = useCallback(async (query: string) => {
    const res = await searchCategoriesAction(query);
    if (res.error) return { error: res.error };
    return {
      data: res.data!.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
    };
  }, []);

  const searchSoftware = useCallback(async (query: string) => {
    const res = await searchSoftwareAction(query);
    if (res.error) return { error: res.error };
    return {
      data: res.data!.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
      })),
    };
  }, []);

  function formPayload(submit: boolean) {
    return {
      name,
      tagline,
      description,
      homepageUrl,
      repositoryUrl,
      primaryLanguage,
      licenseSlug,
      categoryIds: categories.map((c) => c.id),
      alternativeIds: alternatives.map((a) => a.id),
      submit,
      repoMetadataJson: {
        ...(repoMetadata && typeof repoMetadata === "object"
          ? (repoMetadata as Record<string, unknown>)
          : {}),
        licenseSlug: licenseSlug || undefined,
      },
    };
  }

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

  function fetchMetadata() {
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
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [repositoryUrl]);

  function persistDraft(andAdvance: number | null) {
    clearErrors();
    startTransition(async () => {
      const res = await ensureSubmissionDraftAction(
        formPayload(false),
        submissionId ?? undefined,
      );
      if (res.error) {
        applyActionError(res.error);
        return;
      }
      if (res.id) setSubmissionId(res.id);
      if (andAdvance !== null) setStep(andAdvance);
    });
  }

  function save(submit: boolean) {
    clearErrors();
    startTransition(async () => {
      const res = await saveSubmissionAction(
        formPayload(submit),
        submissionId ?? undefined,
      );
      if (res.error) {
        applyActionError(res.error);
        return;
      }
      if (res.id) setSubmissionId(res.id);
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
            <h2 className="font-display text-xl font-medium">App information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about the project and where its source code lives.
            </p>
          </div>
          {Object.keys(fieldErrors).length > 0 && (
            <ValidationSummary fieldErrors={fieldErrors} />
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL</Label>
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
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchMetadata}
                  disabled={pending || !repositoryUrl}
                >
                  {pending ? "Fetching…" : "Fetch metadata"}
                </Button>
              </div>
              {host && host !== "other" && (
                <RepositoryBadge url={repositoryUrl} />
              )}
              <FieldError messages={fieldErrors.repositoryUrl} />
            </div>
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
              <Label htmlFor="homepageUrl">Website</Label>
              <Input
                id="homepageUrl"
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
                placeholder="https://example.com"
                aria-invalid={Boolean(fieldErrors.homepageUrl)}
              />
              <FieldError messages={fieldErrors.homepageUrl} />
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
              >
                <option value="">Select a license (optional)</option>
                {licenses.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                    {l.spdxId ? ` (${l.spdxId})` : ""}
                  </option>
                ))}
              </select>
              <FieldError messages={fieldErrors.licenseSlug} />
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={pending || !repositoryUrl || !name || !description}
              onClick={() => persistDraft(1)}
            >
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h2 className="font-display text-xl font-medium">
              Categories & alternatives
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Help people discover your app and similar software.
            </p>
          </div>
          {Object.keys(fieldErrors).length > 0 && (
            <ValidationSummary fieldErrors={fieldErrors} />
          )}
          <EntitySearchCombobox
            label="Categories"
            description="Choose up to 3 categories. New categories are reviewed by moderators."
            maxItems={3}
            selected={categories}
            onSelectedChange={setCategories}
            onSearch={searchCategories}
            onCreate={async (name) => {
              const res = await createPendingCategoryAction(name);
              if (res.error) return { error: res.error };
              return {
                data: {
                  id: res.data!.id,
                  name: res.data!.name,
                  status: res.data!.status,
                },
              };
            }}
            createLabel="Create category"
            error={fieldErrors.categoryIds?.[0]}
          />
          <EntitySearchCombobox
            label="Alternatives"
            description="Optional — similar or competing tools (pending entries are reviewed)."
            maxItems={10}
            selected={alternatives}
            onSelectedChange={setAlternatives}
            onSearch={searchSoftware}
            onCreate={async (name) => {
              const res = await createPendingSoftwareAction(name);
              if (res.error) return { error: res.error };
              return {
                data: {
                  id: res.data!.id,
                  name: res.data!.name,
                  status: res.data!.status,
                },
              };
            }}
            createLabel="Create alternative"
            error={fieldErrors.alternativeIds?.[0]}
          />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={pending || categories.length === 0}
              onClick={() => persistDraft(2)}
            >
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h2 className="font-display text-xl font-medium">
              Repository verification
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prove you control the repository before submitting for review.
            </p>
          </div>
          <RepositoryVerificationPanel
            submissionId={submissionId}
            onVerifiedChange={setOwnershipVerified}
          />
          <FieldError messages={fieldErrors.ownershipVerified} />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!ownershipVerified || pending}
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h2 className="font-display text-xl font-medium">Review & submit</h2>
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
            {homepageUrl && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Website</dt>
                <dd className="truncate text-xs">{homepageUrl}</dd>
              </div>
            )}
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
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Categories</dt>
              <dd className="text-right">
                {categories.map((c) => c.name).join(", ")}
              </dd>
            </div>
            {alternatives.length > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Alternatives</dt>
                <dd className="text-right">
                  {alternatives.map((a) => a.name).join(", ")}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Ownership</dt>
              <dd>{ownershipVerified ? "Verified" : "Not verified"}</dd>
            </div>
          </dl>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={metadataConfirmed}
              onCheckedChange={(v) => setMetadataConfirmed(v === true)}
              className="mt-0.5"
            />
            <span>
              I confirm this information is accurate and I have rights to submit
              this listing.
            </span>
          </label>
          {Object.keys(fieldErrors).length > 0 && (
            <ValidationSummary fieldErrors={fieldErrors} />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
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
                disabled={
                  !metadataConfirmed || pending || !ownershipVerified
                }
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
