"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type FilterOption = { slug: string; name: string };

type AppsFiltersProps = {
  params: {
    q?: string;
    category?: string;
    platform?: string;
    license?: string;
    tag?: string;
    sort?: string;
  };
  categories: FilterOption[];
  platforms: FilterOption[];
  licenses: FilterOption[];
  className?: string;
};

function FilterFields({
  params,
  categories,
  platforms,
  licenses,
  idPrefix = "",
}: AppsFiltersProps & { idPrefix?: string }) {
  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-surface px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor={`${idPrefix}q`}>Search</Label>
        <SearchInput
          id={`${idPrefix}q`}
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Name, tagline, description…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}category`}>Category</Label>
        <select
          id={`${idPrefix}category`}
          name="category"
          defaultValue={params.category ?? ""}
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}platform`}>Platform</Label>
        <select
          id={`${idPrefix}platform`}
          name="platform"
          defaultValue={params.platform ?? ""}
          className={selectClass}
        >
          <option value="">All platforms</option>
          {platforms.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}license`}>License</Label>
        <select
          id={`${idPrefix}license`}
          name="license"
          defaultValue={params.license ?? ""}
          className={selectClass}
        >
          <option value="">All licenses</option>
          {licenses.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}sort`}>Sort by</Label>
        <select
          id={`${idPrefix}sort`}
          name="sort"
          defaultValue={params.sort ?? "stars"}
          className={selectClass}
        >
          <option value="stars">Popularity</option>
          <option value="updated">Recently updated</option>
          <option value="new">Newly added</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>
      <input type="hidden" name="tag" value={params.tag ?? ""} />
    </>
  );
}

export function AppsFilters(props: AppsFiltersProps) {
  const [open, setOpen] = useState(false);
  const hasActiveFilters = Boolean(
    props.params.q ||
      props.params.category ||
      props.params.platform ||
      props.params.license ||
      (props.params.sort && props.params.sort !== "stars"),
  );

  const filterActions = (
    <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
      <Button type="submit">Apply filters</Button>
      {hasActiveFilters && (
        <Button type="button" variant="ghost" asChild>
          <Link href="/apps">Clear filters</Link>
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-4", props.className)}>
      <div className="flex flex-col gap-3 lg:hidden">
        <form method="get" className="flex gap-2">
          <SearchInput
            name="q"
            defaultValue={props.params.q ?? ""}
            placeholder="Search apps…"
            className="flex-1"
            aria-label="Search apps"
          />
          <input type="hidden" name="category" value={props.params.category ?? ""} />
          <input type="hidden" name="platform" value={props.params.platform ?? ""} />
          <input type="hidden" name="license" value={props.params.license ?? ""} />
          <input type="hidden" name="sort" value={props.params.sort ?? "stars"} />
          <Button type="submit">Go</Button>
        </form>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  •
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter apps</SheetTitle>
            </SheetHeader>
            <form
              method="get"
              className="mt-6 grid gap-4"
              onSubmit={() => setOpen(false)}
            >
              <FilterFields {...props} idPrefix="mobile-" />
              {filterActions}
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <form
        method="get"
        className="hidden gap-4 rounded-xl border border-border bg-surface p-5 lg:grid lg:grid-cols-2"
      >
        <FilterFields {...props} idPrefix="desktop-" />
        {filterActions}
      </form>
    </div>
  );
}
