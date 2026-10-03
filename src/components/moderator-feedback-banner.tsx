import { cn } from "@/lib/utils";

type ModeratorFeedbackBannerProps = {
  status: string;
  message: string;
  className?: string;
};

export function ModeratorFeedbackBanner({
  status,
  message,
  className,
}: ModeratorFeedbackBannerProps) {
  const isRejected = status === "REJECTED";
  const title = isRejected
    ? "Submission rejected"
    : "Moderator requested changes";

  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        isRejected
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/30 bg-amber-500/5",
        className,
      )}
      role="status"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{message}</p>
    </div>
  );
}
