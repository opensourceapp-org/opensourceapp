import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlatformBadgeProps = {
  name: string;
  className?: string;
};

export function PlatformBadge({ name, className }: PlatformBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {name}
    </Badge>
  );
}
