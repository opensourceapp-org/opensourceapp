import { Check } from "lucide-react";
import type { VerificationSignalType } from "@/generated/prisma";
import { signalDisplay } from "@/lib/applications/verification-display";

type Signal = {
  type: VerificationSignalType;
  status: string;
  summary: string;
};

const WHY_TYPES: VerificationSignalType[] = [
  "SOURCE_REPOSITORY",
  "LICENSE",
  "REPO_ACTIVITY",
  "RELEASE",
];

export function WhyListedSection({ signals }: { signals: Signal[] }) {
  const active = signals.filter((s) => s.status === "ACTIVE");
  const items = WHY_TYPES
    .map((type) => active.find((s) => s.type === type))
    .filter(Boolean) as Signal[];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-surface-muted p-5">
      <h2 className="font-display text-lg font-medium">Why this app is listed</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((signal) => {
          const display = signalDisplay(signal.type, signal.summary);
          return (
            <li key={signal.type} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-medium">{display.label}</span>
                {display.description && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {display.description}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
