"use client";

import { useState, useTransition } from "react";
import { updateApplicationAction } from "@/server/actions/admin-applications";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; name: string; slug?: string };

export type ApplicationEditInitial = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  homepageUrl: string;
  repositoryUrl: string;
  repositoryHost: string;
  defaultBranch: string;
  primaryLanguage: string;
  stars: number | null;
  forks: number | null;
  openIssuesCount: number | null;
  logoUrl: string;
  latestReleaseTag: string;
  latestReleaseUrl: string;
  published: boolean;
  categoryIds: string[];
  licenseId: string;
  platformIds: string[];
  tagIds: string[];
  alternativeIds: string[];
};

export function ApplicationEditForm({
  applicationId,
  initial,
  categories,
  licenses,
  platforms,
  tags,
  alternatives,
}: {
  applicationId: string;
  initial: ApplicationEditInitial;
  categories: Option[];
  licenses: Option[];
  platforms: Option[];
  tags: Option[];
  alternatives: Option[];
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setField<K extends keyof ApplicationEditInitial>(
    key: K,
    value: ApplicationEditInitial[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleId(
    key: "categoryIds" | "platformIds" | "tagIds" | "alternativeIds",
    id: string,
    checked: boolean,
    max?: number,
  ) {
    setForm((prev) => {
      const current = new Set(prev[key]);
      if (checked) {
        if (max && current.size >= max && !current.has(id)) {
          return prev;
        }
        current.add(id);
      } else {
        current.delete(id);
      }
      return { ...prev, [key]: [...current] };
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateApplicationAction(applicationId, form);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.href = `/admin/applications/${applicationId}`;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-medium">Basics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={form.tagline}
            onChange={(e) => setField("tagline", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={8}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.published}
            onCheckedChange={(v) => setField("published", v === true)}
          />
          Published (visible on /apps when checked)
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-medium">URLs & repository</h2>
        <div className="space-y-2">
          <Label htmlFor="homepageUrl">Homepage URL</Label>
          <Input
            id="homepageUrl"
            value={form.homepageUrl}
            onChange={(e) => setField("homepageUrl", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="repositoryUrl">Repository URL</Label>
          <Input
            id="repositoryUrl"
            value={form.repositoryUrl}
            onChange={(e) => setField("repositoryUrl", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="repositoryHost">Host</Label>
            <select
              id="repositoryHost"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.repositoryHost}
              onChange={(e) => setField("repositoryHost", e.target.value)}
            >
              <option value="">Auto</option>
              <option value="github">github</option>
              <option value="gitlab">gitlab</option>
              <option value="unknown">unknown</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultBranch">Default branch</Label>
            <Input
              id="defaultBranch"
              value={form.defaultBranch}
              onChange={(e) => setField("defaultBranch", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryLanguage">Primary language</Label>
            <Input
              id="primaryLanguage"
              value={form.primaryLanguage}
              onChange={(e) => setField("primaryLanguage", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-medium">Metadata</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="stars">Stars</Label>
            <Input
              id="stars"
              type="number"
              min={0}
              value={form.stars ?? ""}
              onChange={(e) =>
                setField(
                  "stars",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forks">Forks</Label>
            <Input
              id="forks"
              type="number"
              min={0}
              value={form.forks ?? ""}
              onChange={(e) =>
                setField(
                  "forks",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openIssuesCount">Open issues</Label>
            <Input
              id="openIssuesCount"
              type="number"
              min={0}
              value={form.openIssuesCount ?? ""}
              onChange={(e) =>
                setField(
                  "openIssuesCount",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={form.logoUrl}
            onChange={(e) => setField("logoUrl", e.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latestReleaseTag">Latest release tag</Label>
            <Input
              id="latestReleaseTag"
              value={form.latestReleaseTag}
              onChange={(e) => setField("latestReleaseTag", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="latestReleaseUrl">Latest release URL</Label>
            <Input
              id="latestReleaseUrl"
              value={form.latestReleaseUrl}
              onChange={(e) => setField("latestReleaseUrl", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-medium">Taxonomy</h2>
        <div className="space-y-2">
          <Label>Categories (max 3)</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.categoryIds.includes(c.id)}
                  onCheckedChange={(v) =>
                    toggleId("categoryIds", c.id, v === true, 3)
                  }
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="licenseId">License</Label>
          <select
            id="licenseId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={form.licenseId}
            onChange={(e) => setField("licenseId", e.target.value)}
          >
            <option value="">None</option>
            {licenses.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Platforms</Label>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {platforms.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.platformIds.includes(p.id)}
                  onCheckedChange={(v) =>
                    toggleId("platformIds", p.id, v === true)
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {tags.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.tagIds.includes(t.id)}
                  onCheckedChange={(v) => toggleId("tagIds", t.id, v === true)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Alternatives (max 10)</Label>
          <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
            {alternatives.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.alternativeIds.includes(s.id)}
                  onCheckedChange={(v) =>
                    toggleId("alternativeIds", s.id, v === true, 10)
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={`/admin/applications/${applicationId}`}>Cancel</a>
        </Button>
      </div>
    </form>
  );
}
