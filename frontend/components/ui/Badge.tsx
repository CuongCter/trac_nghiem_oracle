"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "brand"
    | "alternative"
    | "gray"
    | "danger"
    | "success"
    | "warning"
    | "dark";
  size?: "sm" | "lg";
  leftIcon?: React.ReactNode;
}

const variantClasses = {
  brand: "bg-brand-softer border-2 border-border-brand-subtle text-fg-brand-strong",
  alternative: "bg-neutral-primary-soft border-2 border-border-default text-heading",
  gray: "bg-neutral-secondary-medium border-2 border-border-default text-heading",
  danger: "bg-danger-soft border-2 border-border-danger-subtle text-fg-danger-strong",
  success: "bg-success-soft border-2 border-border-success-subtle text-fg-success-strong",
  warning: "bg-warning-soft border-2 border-border-warning-subtle text-fg-warning",
  dark: "bg-dark border-2 border-border-dark text-white",
};

const sizeClasses = {
  sm: "text-tiny px-2.5 py-0.5 gap-1.5",
  lg: "text-small px-3.5 py-1 gap-2",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "alternative", size = "sm", leftIcon, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-pill font-medium shadow-pencil-xs",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      {children}
    </span>
  ),
);
Badge.displayName = "Badge";
