import { EmptyStateVisual } from "@/components/visual/empty-state-visual";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Decorative mini WebGL orbit (public pages only). */
  showVisual?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  showVisual = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/50 px-6 py-14 text-center",
        className,
      )}
    >
      {showVisual ? <EmptyStateVisual /> : null}
      <h3 className="font-display text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
