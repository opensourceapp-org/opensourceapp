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
  const [pending, startTransition] = useTransition();

  const host = repositoryUrl ? detectRepoHost(repositoryUrl) : null;

  function loadMetadata() {
    setError(null);
    startTransition(async () => {
      const res = await fetchRepoMetadataAction(repositoryUrl);
      if (res.error) {
        setError(res.error);
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
    setError(null);
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
        setError(
          typeof res.error === "string" ? res.error : "Validation failed",
        );
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
          </div>
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
          <div className="space-y-4">
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
