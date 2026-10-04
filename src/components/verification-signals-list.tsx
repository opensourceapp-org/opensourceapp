import { Check, Circle, AlertTriangle } from "lucide-react";
import { signalDisplay } from "@/lib/applications/verification-display";
import type { VerificationSignalStatus, VerificationSignalType } from "@/generated/prisma";
type Signal = {
  id: string;
  type: VerificationSignalType;
  status: VerificationSignalStatus;
  summary: string;
  recordedAt: Date;
};

function StatusIcon({ status }: { status: VerificationSignalStatus }) {
  if (status === "ACTIVE") {
    return <Check className="h-4 w-4 text-primary" aria-hidden />;
  }
  if (status === "PENDING") {
    return <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />;
  }
  return <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

export function VerificationSignalsList({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No verification signals recorded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {signals.map((signal) => {
        const display = signalDisplay(signal.type, signal.summary);
        return (
          <li
            key={signal.id}
            className="flex gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm"
          >
            <StatusIcon status={signal.status} />
            <div>
              <p className="font-medium">{display.label}</p>
              <p className="text-muted-foreground">{display.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
