"use client";

import * as React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type AlertVariant = "brand" | "success" | "danger" | "warning";

const variantClasses: Record<AlertVariant, string> = {
  brand: "bg-brand-softer border-2 border-dashed border-border-brand-subtle text-fg-brand-strong",
  success:
    "bg-success-soft border-2 border-dashed border-border-success-subtle text-fg-success-strong",
  danger:
    "bg-danger-soft border-2 border-dashed border-border-danger-subtle text-fg-danger-strong",
  warning:
    "bg-warning-soft border-2 border-dashed border-border-warning-subtle text-fg-warning",
};

const iconMap: Record<AlertVariant, React.ReactNode> = {
  brand: <Info className="h-5 w-5" aria-hidden />,
  success: <CheckCircle2 className="h-5 w-5" aria-hidden />,
  danger: <AlertCircle className="h-5 w-5" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5" aria-hidden />,
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "brand",
      title,
      description,
      dismissible,
      onDismiss,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(true);
    if (!visible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative flex gap-3 rounded-card p-5 shadow-pencil-sm",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        <span className="mt-0.5 inline-flex shrink-0">
          {icon ?? iconMap[variant]}
        </span>
        <div className="flex-1">
          {title ? (
            <h5 className="mb-1 text-body font-medium">{title}</h5>
          ) : null}
          {description ? (
            <p className="text-small leading-relaxed">{description}</p>
          ) : null}
          {children}
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-current transition-colors hover:bg-black/10"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  },
);
Alert.displayName = "Alert";
