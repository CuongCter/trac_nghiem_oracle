"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  align = "left",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b-2 border-dashed border-border-default pb-8 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("flex-1", align === "center" && "max-w-2xl")}>
        {eyebrow ? (
          <p className="mb-2 text-tiny font-medium uppercase tracking-wider text-fg-brand">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-handrawn text-heading">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-leading text-body">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
