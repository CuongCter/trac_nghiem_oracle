"use client";

import * as React from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/format";
import { COUNTDOWN_CRITICAL_MS, COUNTDOWN_WARNING_MS } from "@/lib/constants";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

interface ExamCountdownProps {
  /** Absolute target timestamp in ms (e.g. min(endTime, startedAt + duration)) */
  target: number | null;
  onExpire: () => void;
}

export function ExamCountdown({ target, onExpire }: ExamCountdownProps) {
  const { remaining } = useCountdown(target, onExpire);
  const isWarning = remaining > 0 && remaining <= COUNTDOWN_WARNING_MS;
  const isCritical = remaining > 0 && remaining <= COUNTDOWN_CRITICAL_MS;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border-2 border-dashed border-border-dark bg-neutral-primary-medium px-4 py-2 shadow-pencil-sm",
        isCritical && "border-danger",
        isWarning && !isCritical && "border-border-warning",
      )}
      role="timer"
      aria-live="polite"
    >
      <Clock
        className={cn(
          "h-5 w-5",
          isCritical ? "text-danger" : isWarning ? "text-fg-warning" : "text-body",
        )}
      />
      <span
        className={cn(
          "font-handrawn text-display-5",
          isCritical ? "text-fg-danger" : isWarning ? "text-fg-warning" : "text-heading",
        )}
      >
        {formatCountdown(remaining)}
      </span>
    </div>
  );
}
