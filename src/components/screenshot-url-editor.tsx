"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RemoteImage } from "@/components/remote-image";
import { MAX_SCREENSHOTS } from "@/lib/validation/screenshot-urls";
import { cn } from "@/lib/utils";

type ScreenshotUrlEditorProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
  fieldErrors?: string[];
  appName?: string;
  className?: string;
};

function validPreviewUrls(urls: string[]): string[] {
  return urls
    .map((u) => u.trim())
    .filter((u) => {
      if (!u) return false;
      try {
        return new URL(u).protocol === "https:";
      } catch {
        return false;
      }
    });
}

export function ScreenshotUrlEditor({
  urls,
  onChange,
  fieldErrors,
  appName = "App",
  className,
}: ScreenshotUrlEditorProps) {
  const [rows, setRows] = useState<string[]>(() =>
    urls.length > 0 ? [...urls, ""] : [""],
  );

  // Sync when parent changes URLs (e.g. repo verification import), but do not
  // wipe in-progress empty rows — `onChange` only sends non-empty URLs.
  useEffect(() => {
    setRows((current) => {
      const committed = current.map((u) => u.trim()).filter(Boolean);
      const unchanged =
        committed.length === urls.length &&
        committed.every((u, i) => u === urls[i]);
      if (unchanged) return current;
      return urls.length > 0 ? [...urls, ""] : [""];
    });
  }, [urls]);

  const previewUrls = validPreviewUrls(rows);

  function commit(nextRows: string[]) {
    setRows(nextRows);
    onChange(nextRows.map((u) => u.trim()).filter(Boolean));
  }

  function setRow(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    commit(next);
  }

  function addRow() {
    if (previewUrls.length >= MAX_SCREENSHOTS) return;
    const trimmed = rows.map((u) => u.trim()).filter(Boolean);
    if (trimmed.length >= MAX_SCREENSHOTS) return;
    commit([...trimmed, ""]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    commit(next.length ? next : [""]);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>Screenshots</Label>
        <span className="text-xs text-muted-foreground">
          {previewUrls.length}/{MAX_SCREENSHOTS} · HTTPS image URLs
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Optional. Add up to {MAX_SCREENSHOTS} screenshot URLs, or place PNG/JPEG/WebP
        files in{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          .opensourceapp/screenshots/
        </code>{" "}
        — we import them when you verify the repository.
      </p>
      <ul className="space-y-2">
        {rows.map((url, index) => (
          <li key={index} className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setRow(index, e.target.value)}
              placeholder="https://…"
              aria-label={`Screenshot URL ${index + 1}`}
              aria-invalid={Boolean(fieldErrors?.length)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1 && !url.trim()}
              aria-label={`Remove screenshot URL ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={previewUrls.length >= MAX_SCREENSHOTS}
      >
        <Plus className="h-4 w-4" />
        Add screenshot URL
      </Button>
      {fieldErrors?.length ? (
        <p className="text-sm text-destructive" role="alert">
          {fieldErrors[0]}
        </p>
      ) : null}
      {previewUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previewUrls.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="overflow-hidden rounded-lg border border-border bg-surface-muted"
              >
                <RemoteImage
                  src={src}
                  alt={`${appName} screenshot ${index + 1}`}
                  width={400}
                  height={225}
                  className="aspect-video h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
