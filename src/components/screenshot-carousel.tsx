"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/remote-image";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 6000;

type ScreenshotCarouselProps = {
  urls: string[];
  appName: string;
  className?: string;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function ScreenshotCarousel({
  urls,
  appName,
  className,
}: ScreenshotCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const count = urls.length;
  const safeIndex = count > 0 ? index % count : 0;

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return;
    const id = window.setInterval(() => go(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reducedMotion, go]);

  if (count === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No screenshots have been added for this app yet.
      </p>
    );
  }

  return (
    <div
      className={cn("space-y-4", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-surface-muted"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${appName} screenshots`}
      >
        <div className="relative aspect-video w-full">
          {urls.map((src, i) => (
            <div
              key={src}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                i === safeIndex
                  ? "z-10 opacity-100"
                  : "pointer-events-none opacity-0",
                reducedMotion && "duration-0",
              )}
              aria-hidden={i !== safeIndex}
            >
              <RemoteImage
                src={src}
                alt={`${appName} screenshot ${i + 1} of ${count}`}
                width={1280}
                height={720}
                className="h-full w-full object-contain bg-background"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 bg-background/90 shadow-sm"
              onClick={() => go(-1)}
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 bg-background/90 shadow-sm"
              onClick={() => go(1)}
              aria-label="Next screenshot"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {count > 1 && (
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label="Screenshot slides"
        >
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Screenshot ${i + 1}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                i === safeIndex ? "bg-primary" : "bg-muted-foreground/30",
              )}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">
        {safeIndex + 1} / {count}
        {paused || reducedMotion ? "" : " · Auto-advancing"}
      </p>
    </div>
  );
}
