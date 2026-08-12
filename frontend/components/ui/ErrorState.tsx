"use client";

import * as React from "react";
import { AlertOctagon } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Đã xảy ra lỗi",
  description = "Vui lòng thử lại hoặc liên hệ quản trị viên nếu lỗi vẫn tiếp diễn.",
  onRetry,
  retryLabel = "Thử lại",
  className,
}: ErrorStateProps) {
  return (
    <Card variant="default" padding="lg" className={cn("text-center", className)}>
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border-danger bg-danger-soft text-fg-danger-strong">
        <AlertOctagon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 font-handrawn text-display-6 text-heading">{title}</h3>
      <p className="mx-auto mb-4 max-w-md text-body text-body-subtle">{description}</p>
      {onRetry ? (
        <Button variant="brand" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Card>
  );
}
