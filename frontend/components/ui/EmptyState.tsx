"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "Chưa có dữ liệu",
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card variant="default" padding="lg" className={cn("text-center", className)}>
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border-default-medium bg-neutral-primary-soft text-body-subtle">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="mb-2 font-handrawn text-display-6 text-heading">{title}</h3>
      {description ? (
        <p className="mx-auto mb-4 max-w-md text-body text-body-subtle">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="brand" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
