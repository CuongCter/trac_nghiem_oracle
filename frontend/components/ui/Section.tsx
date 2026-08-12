"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "md" | "lg" | "xl";
  as?: "section" | "div" | "main" | "article";
}

const sizeMap = {
  sm: "py-12 md:py-14",
  md: "py-14 md:py-16 lg:py-20",
  lg: "py-20 md:py-22 lg:py-24",
  xl: "py-24 md:py-28 lg:py-30",
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, size = "md", as: Tag = "section", children, ...props }, ref) => (
    <Tag
      ref={ref as never}
      className={cn(
        "w-full",
        sizeMap[size],
        className,
      )}
      {...props}
    >
      <div className="container">{children}</div>
    </Tag>
  ),
);
Section.displayName = "Section";
