import Link from "next/link";
import { NotFoundVisual } from "@/components/visual/not-found-visual";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-16 text-center">
      <NotFoundVisual />
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          404
        </p>
        <h1 className="font-display text-3xl font-normal tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist or may have moved.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/apps">Browse apps</Link>
        </Button>
      </div>
    </div>
  );
}
