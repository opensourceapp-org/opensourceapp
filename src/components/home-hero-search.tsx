"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";

export function HomeHeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/apps${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search apps, categories, licenses…"
        className="flex-1"
        aria-label="Search apps"
      />
      <Button type="submit" size="lg" className="shrink-0">
        Search
      </Button>
    </form>
  );
}
