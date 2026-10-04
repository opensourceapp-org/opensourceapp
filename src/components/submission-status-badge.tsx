import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  SUBMITTED: { label: "Submitted", variant: "secondary" },
  UNDER_REVIEW: { label: "Under review", variant: "default" },
  APPROVED: { label: "Published", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CHANGES_REQUESTED: { label: "Needs changes", variant: "outline" },
  DELETED: { label: "Deleted", variant: "outline" },
};

type SubmissionStatusBadgeProps = {
  status: string;
  className?: string;
};

export function SubmissionStatusBadge({
  status,
  className,
}: SubmissionStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return (
    <Badge variant={config.variant} className={cn("font-normal", className)}>
      {config.label}
    </Badge>
  );
}
