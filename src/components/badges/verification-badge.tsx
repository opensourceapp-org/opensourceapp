import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationBadgeProps = {
  verified?: boolean;
  label?: string;
  className?: string;
};

export function VerificationBadge({
  verified = false,
  label = "Verified signals",
  className,
}: VerificationBadgeProps) {
  if (!verified) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
