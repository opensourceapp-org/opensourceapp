"use client";

import { useState, useTransition } from "react";
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
  type FieldErrorMap,
  flattenFieldErrors,
  parseActionError,
} from "@/lib/validation/field-errors";
import { cn } from "@/lib/utils";

const STEPS = ["Repository", "Details", "Confirm"] as const;

export function SubmitForm() {
  const [step, setStep] = useState(0);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [metadataConfirmed, setMetadataConfirmed] = useState(false);
  const [repoMetadata, setRepoMetadata] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [pending, startTransition] = useTransition();

  function applyActionError(err: unknown) {
    const parsed = parseActionError(err);
    setFieldErrors(parsed.fieldErrors);
    setError(
      parsed.fieldErrors && Object.keys(parsed.fieldErrors).length > 0
        ? parsed.message
        : parsed.message ?? "Something went wrong.",
    );
    if (parsed.fieldErrors.repositoryUrl) setStep(0);
    else if (
      parsed.fieldErrors.name ||
      parsed.fieldErrors.description ||
      parsed.fieldErrors.tagline ||
      parsed.fieldErrors.homepageUrl ||
      parsed.fieldErrors.primaryLanguage
    ) {
      setStep(1);
    }
  }

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  function fieldError(id: string) {
    const msgs = fieldErrors[id];
    if (!msgs?.length) return null;
    return (
      <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
        {msgs.join(" ")}
      </p>
    );
  }

  function validationSummary() {
    const lines = flattenFieldErrors(fieldErrors);
    if (!lines.length) return null;
    return (
      <div
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        role="alert"
        aria-live="polite"
      >
        <p className="font-medium">Could not save your submission</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    );
  }

  const host = repositoryUrl ? detectRepoHost(repositoryUrl) : null;

  function loadMetadata() {
    clearErrors();
    startTransition(async () => {
      const res = await fetchRepoMetadataAction(repositoryUrl);
      if (res.error) {
        applyActionError(res.error);
        return;
      }
      const data = res.data!;
      setRepoMetadata(data);
      setName(data.name);
      setDescription(data.description ?? "");
      setHomepageUrl(data.homepageUrl ?? "");
      setPrimaryLanguage(data.primaryLanguage ?? "");
      setMetadataConfirmed(false);
      setStep(1);
    });
  }

  function save(submit: boolean) {
    clearErrors();
    startTransition(async () => {
      const res = await createSubmissionFromRepoAction(
        repositoryUrl,
        repoMetadata,
        {
          name,
          tagline,
          description,
          homepageUrl,
          primaryLanguage,
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
              We detect the host automatically and pull public metadata for you
              to review.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repositoryUrl">Source repository</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="repositoryUrl"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/org/project"
                aria-invalid={Boolean(fieldErrors.repositoryUrl)}
                aria-describedby={
                  fieldErrors.repositoryUrl ? "repositoryUrl-error" : undefined
                }
                className={cn(fieldErrors.repositoryUrl && "border-destructive")}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={loadMetadata}
                disabled={pending || !repositoryUrl}
              >
                {pending ? "Fetching…" : "Fetch metadata"}
              </Button>
            </div>
            {host && host !== "other" && (
              <RepositoryBadge url={repositoryUrl} />
            )}
            {host === "other" && repositoryUrl && (
              <p className="text-xs text-muted-foreground">
                Supported hosts: GitHub, GitLab, Codeberg. Other URLs may still
                work if metadata is reachable.
              </p>
            )}
            {fieldError("repositoryUrl")}
          </div>
          {validationSummary()}
          {error && !Object.keys(fieldErrors).length && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
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
          {validationSummary()}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                className={cn(fieldErrors.name && "border-destructive")}
              />
              {fieldError("name")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                aria-invalid={Boolean(fieldErrors.tagline)}
                aria-describedby={
                  fieldErrors.tagline ? "tagline-error" : undefined
                }
                className={cn(fieldErrors.tagline && "border-destructive")}
              />
              {fieldError("tagline")}
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
                aria-describedby={
                  fieldErrors.description ? "description-error" : undefined
                }
                className={cn(fieldErrors.description && "border-destructive")}
              />
              <p className="text-xs text-muted-foreground">
                At least 20 characters.
              </p>
              {fieldError("description")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="homepageUrl">Homepage</Label>
                <Input
                  id="homepageUrl"
                  value={homepageUrl}
                  onChange={(e) => setHomepageUrl(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.homepageUrl)}
                  aria-describedby={
                    fieldErrors.homepageUrl ? "homepageUrl-error" : undefined
                  }
                  className={cn(fieldErrors.homepageUrl && "border-destructive")}
                />
                {fieldError("homepageUrl")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryLanguage">Primary language</Label>
                <Input
                  id="primaryLanguage"
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.primaryLanguage)}
                  aria-describedby={
                    fieldErrors.primaryLanguage
                      ? "primaryLanguage-error"
                      : undefined
                  }
                  className={cn(
                    fieldErrors.primaryLanguage && "border-destructive",
                  )}
                />
                {fieldError("primaryLanguage")}
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
          {validationSummary()}
          {error && !Object.keys(fieldErrors).length && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
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
