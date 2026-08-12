"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type IconShapeVariant = "brand" | "gray" | "danger" | "success" | "warning";
type IconShapeSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<IconShapeSize, { box: string; icon: string }> = {
  xs: { box: "h-7 w-7", icon: "h-3.5 w-3.5" },
  sm: { box: "h-9 w-9", icon: "h-4.5 w-4.5" },
  md: { box: "h-11 w-11", icon: "h-5.5 w-5.5" },
  lg: { box: "h-13 w-13", icon: "h-6.5 w-6.5" },
  xl: { box: "h-15 w-15", icon: "h-7.5 w-7.5" },
};

const variantClasses: Record<IconShapeVariant, string> = {
  brand: "bg-brand-softer text-fg-brand-strong",
  gray: "bg-neutral-secondary-medium text-body",
  danger: "bg-danger-soft text-fg-danger-strong",
  success: "bg-success-soft text-fg-success-strong",
  warning: "bg-warning-soft text-fg-warning",
};

export interface IconShapeProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: React.ReactNode;
  variant?: IconShapeVariant;
  size?: IconShapeSize;
}

export const IconShape = React.forwardRef<HTMLSpanElement, IconShapeProps>(
  ({ className, icon, variant = "brand", size = "md", ...props }, ref) => {
    const sizing = sizeMap[size];
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full border-2 border-border-dark",
          sizing.box,
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        <span className={cn("inline-flex", sizing.icon)}>{icon}</span>
      </span>
    );
  },
);
IconShape.displayName = "IconShape";
