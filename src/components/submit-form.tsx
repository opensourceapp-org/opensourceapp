"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSubmissionFromRepoAction,
  fetchRepoMetadataAction,
} from "@/server/actions/submissions";

export function SubmitForm() {
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
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="repositoryUrl">Repository URL</Label>
        <div className="flex gap-2">
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
            Fetch
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Metadata is fetched from the host API. Review and edit before saving.
        </p>
      </div>

      {repoMetadata !== null && (
        <div className="space-y-4 rounded-lg border p-4">
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={metadataConfirmed}
              onChange={(e) => setMetadataConfirmed(e.target.checked)}
            />
            I confirm this information is accurate
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

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
  );
}
