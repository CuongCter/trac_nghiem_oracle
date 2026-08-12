"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "brand"
  | "secondary"
  | "tertiary"
  | "success"
  | "danger"
  | "warning"
  | "dark"
  | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-medium outline-none border-2 border-dashed border-[#2b2418] rounded-pill transition-[transform,box-shadow,background-color,color] duration-100 ease-in-out select-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "text-tiny px-4 py-1.5",
  sm: "text-small px-5 py-2",
  md: "text-body px-8 py-3",
  lg: "text-body px-9 py-4",
  xl: "text-leading px-10 py-5",
};

const variantClasses: Record<ButtonVariant, string> = {
  brand: cn(
    "bg-brand text-white",
    "shadow-[0_0_0_4px_theme(colors.brand),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-brand-strong hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.brand-strong),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.brand-strong)]",
  ),
  secondary: cn(
    "bg-neutral-primary-medium text-heading",
    "shadow-[0_0_0_4px_theme(colors.neutral-primary-medium),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-neutral-tertiary hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.neutral-tertiary),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.neutral-tertiary)]",
  ),
  tertiary: cn(
    "bg-neutral-primary-soft text-body",
    "shadow-[0_0_0_4px_theme(colors.neutral-primary-soft),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-neutral-secondary-medium hover:text-heading hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.neutral-secondary-medium),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.neutral-secondary-medium)]",
  ),
  success: cn(
    "bg-success text-white",
    "shadow-[0_0_0_4px_theme(colors.success),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-success-strong hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.success-strong),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.success-strong)]",
  ),
  danger: cn(
    "bg-danger text-white",
    "shadow-[0_0_0_4px_theme(colors.danger),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-danger-strong hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.danger-strong),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.danger-strong)]",
  ),
  warning: cn(
    "bg-warning text-dark",
    "shadow-[0_0_0_4px_theme(colors.warning),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-warning-strong hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.warning-strong),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.warning-strong)]",
  ),
  dark: cn(
    "bg-dark text-white",
    "shadow-[0_0_0_4px_theme(colors.dark),2px_2px_4px_2px_rgba(0,0,0,0.5)]",
    "hover:bg-dark-strong hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_0_0_4px_theme(colors.dark-strong),1px_1px_4px_2px_rgba(0,0,0,0.5)]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0_0_0_4px_theme(colors.dark-strong)]",
  ),
  ghost: cn(
    "bg-transparent text-heading border-transparent shadow-none",
    "hover:bg-neutral-secondary-medium",
  ),
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "brand",
      size = "md",
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth,
      asChild = false,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    return (
      <Comp
        ref={ref as never}
        type={asChild ? undefined : type}
        disabled={isDisabled}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : leftIcon ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {leftIcon}
          </span>
        ) : null}
        {children}
        {rightIcon && !loading ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {rightIcon}
          </span>
        ) : null}
      </Comp>
    );
  },
);
Button.displayName = "Button";
