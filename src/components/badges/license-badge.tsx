import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LicenseBadgeProps = {
  name: string;
  spdxId?: string | null;
  className?: string;
};

export function LicenseBadge({ name, spdxId, className }: LicenseBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("font-mono text-xs font-normal", className)}>
      {spdxId ?? name}
    </Badge>
  );
}
