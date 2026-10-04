"use client";

import { useState, type ReactNode, type SelectHTMLAttributes } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  FolderOpen,
  Monitor,
  Scale,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type FilterParams = {
  q?: string;
  category?: string;
  platform?: string;
  license?: string;
  tag?: string;
  sort?: string;
};

type AppsFiltersProps = {
  params: FilterParams;
  categories: FilterOption[];
  platforms: FilterOption[];
  licenses: FilterOption[];
  className?: string;
};

const SORT_LABELS: Record<string, string> = {
  stars: "Popularity",
  updated: "Recently updated",
  new: "Newly added",
  name: "Name (A–Z)",
};

const selectClassName =
  "h-9 w-full min-w-0 appearance-none rounded-lg border border-border/80 bg-surface bg-[length:1rem] bg-[position:right_0.65rem_center] bg-no-repeat pl-3 pr-9 text-sm text-foreground shadow-none transition-colors hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23666%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]";

function appsSearchHref(
  params: FilterParams,
  omit?: "q" | "category" | "platform" | "license" | "sort",
): string {
  const sp = new URLSearchParams();
  if (params.q && omit !== "q") sp.set("q", params.q);
  if (params.category && omit !== "category")
    sp.set("category", params.category);
  if (params.platform && omit !== "platform")
    sp.set("platform", params.platform);
  if (params.license && omit !== "license") sp.set("license", params.license);
  if (params.tag) sp.set("tag", params.tag);
  const sort = params.sort ?? "stars";
  if (sort !== "stars" && omit !== "sort") sp.set("sort", sort);
  const qs = sp.toString();
  return qs ? `/apps?${qs}` : "/apps";
}

function lookupName(options: FilterOption[], slug: string | undefined) {
  if (!slug) return null;
  return options.find((o) => o.slug === slug)?.name ?? slug;
}

function CompactSelect({
  id,
  name,
  label,
  icon: Icon,
  defaultValue,
  onChange,
  children,
}: {
  id: string;
  name: string;
  label: string;
  icon: typeof FolderOpen;
  defaultValue: string;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"];
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-[9.5rem] flex-1 flex-col gap-1 sm:max-w-[11rem]">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={selectClassName}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
}

function FilterFields({
  params,
  categories,
  platforms,
  licenses,
  idPrefix = "",
  onSelectChange,
  layout = "stacked",
}: AppsFiltersProps & {
  idPrefix?: string;
  onSelectChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"];
  layout?: "stacked" | "inline";
}) {
  const searchBlock = (
    <div
      className={cn(
        "min-w-0 flex-1",
        layout === "stacked" ? "space-y-1" : "flex flex-col gap-1",
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Search
      </span>
      <SearchInput
        id={`${idPrefix}q`}
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Name, tagline, description…"
        className="w-full [&_input]:h-10 [&_input]:rounded-lg [&_input]:shadow-none"
      />
    </div>
  );

  const selects = (
    <>
      <CompactSelect
        id={`${idPrefix}category`}
        name="category"
        label="Category"
        icon={FolderOpen}
        defaultValue={params.category ?? ""}
        onChange={onSelectChange}
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </CompactSelect>
      <CompactSelect
        id={`${idPrefix}platform`}
        name="platform"
        label="Platform"
        icon={Monitor}
        defaultValue={params.platform ?? ""}
        onChange={onSelectChange}
      >
        <option value="">All</option>
        {platforms.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </CompactSelect>
      <CompactSelect
        id={`${idPrefix}license`}
        name="license"
        label="License"
        icon={Scale}
        defaultValue={params.license ?? ""}
        onChange={onSelectChange}
      >
        <option value="">All</option>
        {licenses.map((l) => (
          <option key={l.slug} value={l.slug}>
            {l.name}
          </option>
        ))}
      </CompactSelect>
      <CompactSelect
        id={`${idPrefix}sort`}
        name="sort"
        label="Sort"
        icon={ArrowUpDown}
        defaultValue={params.sort ?? "stars"}
        onChange={onSelectChange}
      >
        <option value="stars">Popularity</option>
        <option value="updated">Recently updated</option>
        <option value="new">Newly added</option>
        <option value="name">Name (A–Z)</option>
      </CompactSelect>
    </>
  );

  return (
    <>
      {layout === "inline" ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {searchBlock}
          <div className="flex flex-wrap gap-3 lg:flex-nowrap">{selects}</div>
        </div>
      ) : (
        <>
          {searchBlock}
          <div className="grid gap-3 sm:grid-cols-2">{selects}</div>
        </>
      )}
      <input type="hidden" name="tag" value={params.tag ?? ""} />
    </>
  );
}

function ActiveFilterChips({
  params,
  categories,
  platforms,
  licenses,
}: Pick<
  AppsFiltersProps,
  "params" | "categories" | "platforms" | "licenses"
>) {
  const sort = params.sort ?? "stars";
  const chips: { key: string; label: string; omit: "q" | "category" | "platform" | "license" | "sort" }[] = [];

  if (params.q?.trim()) {
    chips.push({ key: "q", label: `"${params.q.trim()}"`, omit: "q" });
  }
  const categoryName = lookupName(categories, params.category);
  if (categoryName) {
    chips.push({ key: "category", label: categoryName, omit: "category" });
  }
  const platformName = lookupName(platforms, params.platform);
  if (platformName) {
    chips.push({ key: "platform", label: platformName, omit: "platform" });
  }
  const licenseName = lookupName(licenses, params.license);
  if (licenseName) {
    chips.push({ key: "license", label: licenseName, omit: "license" });
  }
  if (sort !== "stars") {
    chips.push({
      key: "sort",
      label: SORT_LABELS[sort] ?? sort,
      omit: "sort",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-xs text-muted-foreground">Active</span>
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={appsSearchHref(params, chip.omit)}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/15 bg-primary/[0.06] py-1 pl-2.5 pr-1 text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="truncate">{chip.label}</span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-foreground">
            <X className="h-3 w-3" aria-hidden />
          </span>
          <span className="sr-only">Remove {chip.label} filter</span>
        </Link>
      ))}
      <Link
        href="/apps"
        className="text-xs font-medium text-primary hover:underline"
      >
        Clear all
      </Link>
    </div>
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

  function handleSelectAutoSubmit(
    e: React.ChangeEvent<HTMLSelectElement>,
  ) {
    e.currentTarget.form?.requestSubmit();
  }

  const filterActions = (variant: "desktop" | "mobile") => (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        variant === "desktop" ? "shrink-0" : "pt-2",
      )}
    >
      <Button type="submit" className="rounded-lg px-5">
        {variant === "desktop" ? "Search" : "Apply filters"}
      </Button>
      {hasActiveFilters && variant === "mobile" && (
        <Button type="button" variant="ghost" asChild className="rounded-lg">
          <Link href="/apps">Clear filters</Link>
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-3", props.className)}>
      <div className="flex flex-col gap-3 lg:hidden">
        <form
          method="get"
          className="flex gap-2 rounded-2xl border border-border/70 bg-surface-muted/50 p-3"
        >
          <SearchInput
            name="q"
            defaultValue={props.params.q ?? ""}
            placeholder="Search apps…"
            className="min-w-0 flex-1 [&_input]:h-10 [&_input]:rounded-lg [&_input]:shadow-none"
            aria-label="Search apps"
          />
          <input
            type="hidden"
            name="category"
            value={props.params.category ?? ""}
          />
          <input
            type="hidden"
            name="platform"
            value={props.params.platform ?? ""}
          />
          <input
            type="hidden"
            name="license"
            value={props.params.license ?? ""}
          />
          <input type="hidden" name="sort" value={props.params.sort ?? "stars"} />
          <input type="hidden" name="tag" value={props.params.tag ?? ""} />
          <Button type="submit" className="shrink-0 rounded-lg">
            Search
          </Button>
        </form>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full rounded-xl border-border/80 bg-surface shadow-none"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters & sort
              {hasActiveFilters && (
                <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                  On
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[88vh] overflow-y-auto rounded-t-2xl border-border/80"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-2xl font-normal tracking-tight">
                Refine results
              </SheetTitle>
            </SheetHeader>
            <form
              method="get"
              className="mt-6 space-y-5"
              onSubmit={() => setOpen(false)}
            >
              <FilterFields
                {...props}
                idPrefix="mobile-"
                layout="stacked"
              />
              {filterActions("mobile")}
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <form
        method="get"
        className="hidden space-y-4 rounded-2xl border border-border/70 bg-surface-muted/40 p-4 md:p-5 lg:block"
      >
        <FilterFields
          {...props}
          idPrefix="desktop-"
          layout="inline"
          onSelectChange={handleSelectAutoSubmit}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <p className="text-xs text-muted-foreground">
            Filters apply instantly · use Search to update keywords
          </p>
          {filterActions("desktop")}
        </div>
      </form>

      <ActiveFilterChips
        params={props.params}
        categories={props.categories}
        platforms={props.platforms}
        licenses={props.licenses}
      />
    </div>
  );
}
