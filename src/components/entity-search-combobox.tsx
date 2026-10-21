"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type EntityOption = {
  id: string;
  name: string;
  status?: string;
};

type EntitySearchComboboxProps = {
  label: string;
  description?: string;
  placeholder?: string;
  maxItems: number;
  selected: EntityOption[];
  onSelectedChange: (items: EntityOption[]) => void;
  onSearch: (query: string) => Promise<{ data?: EntityOption[]; error?: string }>;
  onCreate?: (
    name: string,
  ) => Promise<{ data?: EntityOption; error?: string }>;
  createLabel?: string;
  error?: string;
};

export function EntitySearchCombobox({
  label,
  description,
  placeholder = "Search…",
  maxItems,
  selected,
  onSelectedChange,
  onSearch,
  onCreate,
  createLabel = "Create",
  error,
}: EntitySearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const res = await onSearch(query);
        if (res.data) setOptions(res.data);
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, open, onSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function addItem(item: EntityOption) {
    if (selected.some((s) => s.id === item.id)) return;
    if (selected.length >= maxItems) return;
    onSelectedChange([...selected, item]);
    setQuery("");
    setOpen(false);
  }

  function removeItem(id: string) {
    onSelectedChange(selected.filter((s) => s.id !== id));
  }

  function handleCreate() {
    if (!onCreate || !query.trim()) return;
    setActionError(null);
    startTransition(async () => {
      const res = await onCreate(query.trim());
      if (res.error) {
        setActionError(res.error);
        return;
      }
      if (res.data) addItem(res.data);
    });
  }

  const showCreate =
    onCreate &&
    query.trim().length >= 2 &&
    !options.some(
      (o) => o.name.toLowerCase() === query.trim().toLowerCase(),
    );

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={selected.length >= maxItems}
          aria-invalid={Boolean(error)}
        />
        {open && (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
            role="listbox"
          >
            {options.length === 0 && !showCreate && (
              <li className="px-3 py-2 text-muted-foreground">
                {query.trim().length < 2
                  ? `Type to search, or enter a name (2+ characters) to ${createLabel.toLowerCase()}.`
                  : "No matches. Use create below or try another search."}
              </li>
            )}
            {options
              .filter((o) => !selected.some((s) => s.id === o.id))
              .map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted"
                    onClick={() => addItem(o)}
                  >
                    <span>{o.name}</span>
                    {o.status === "PENDING" && (
                      <Badge variant="outline" className="text-xs font-normal">
                        Pending
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            {showCreate && (
              <li
                className={cn(
                  "px-2 py-2",
                  options.length > 0 && "border-t border-border",
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleCreate}
                  disabled={pending}
                >
                  + {createLabel} &quot;{query.trim()}&quot;
                </Button>
              </li>
            )}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-1 pr-1 font-normal"
            >
              {item.name}
              {item.status === "PENDING" && (
                <span className="text-muted-foreground">(pending)</span>
              )}
              <button
                type="button"
                className={cn("rounded-sm p-0.5 hover:bg-muted")}
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {selected.length} / {maxItems} selected
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      {actionError && (
        <p className="text-sm text-destructive" role="alert">{actionError}</p>
      )}
    </div>
  );
}
