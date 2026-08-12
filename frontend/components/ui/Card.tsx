"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "quiet" | "brand" | "interactive";

const variantClasses: Record<CardVariant, string> = {
  default: cn(
    "bg-neutral-primary-medium",
    "shadow-[0_0_0_4px_theme(colors.neutral-primary-medium),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
  ),
  quiet: cn(
    "bg-neutral-primary-soft",
    "shadow-[0_0_0_4px_theme(colors.neutral-primary-soft),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
  ),
  brand: cn(
    "bg-brand-softer",
    "shadow-[0_0_0_4px_theme(colors.brand-softer),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
  ),
  interactive: cn(
    "bg-neutral-primary-medium cursor-pointer transition-[transform,box-shadow,background-color] duration-150 ease-in-out",
    "shadow-[0_0_0_4px_theme(colors.neutral-primary-medium),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-neutral-tertiary hover:shadow-[0_0_0_4px_theme(colors.neutral-tertiary),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.neutral-tertiary)]",
  ),
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
}

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = "default", padding = "md", as: Tag = "div", children, ...props },
    ref,
  ) => (
    <Tag
      ref={ref as never}
      className={cn(
        "border-2 border-dashed border-[#2b2418] rounded-card outline-none",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  ),
);
Card.displayName = "Card";

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-1 border-b-2 border-dashed border-border-default pb-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-handrawn text-display-5 text-heading leading-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-small text-body-subtle", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-body text-body", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-end gap-2 border-t-2 border-dashed border-border-default pt-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
