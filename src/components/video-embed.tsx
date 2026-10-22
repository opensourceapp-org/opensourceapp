import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseVideoEmbed } from "@/lib/validation/video-url";
import { cn } from "@/lib/utils";

type VideoEmbedProps = {
  url: string;
  title: string;
  className?: string;
};

export function VideoEmbed({ url, title, className }: VideoEmbedProps) {
  const info = parseVideoEmbed(url);
  if (!info) return null;

  if (info.kind === "youtube" || info.kind === "vimeo") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-surface-muted",
          className,
        )}
      >
        <div className="relative aspect-video w-full">
          <iframe
            src={info.embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }

  return (
    <Button asChild variant="outline" className={className}>
      <Link href={info.watchUrl} target="_blank" rel="noopener noreferrer">
        Watch video
        <ExternalLink className="h-4 w-4" aria-hidden />
      </Link>
    </Button>
  );
}
