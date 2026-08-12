"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function Spinner({ className, size = "md", label, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-2 text-body", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-brand", sizeMap[size])} />
      {label ? <span className="text-small font-medium">{label}</span> : null}
    </span>
  );
}

export interface FullPageSpinnerProps {
  label?: string;
}

export function FullPageSpinner({ label = "Đang tải..." }: FullPageSpinnerProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
