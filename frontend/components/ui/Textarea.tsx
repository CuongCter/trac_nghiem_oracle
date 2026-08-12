"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      id,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const inputId = id ?? `textarea-${reactId}`;
    const hasError = !!error;
    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-2 ml-4 block text-small font-medium text-heading"
          >
            {label}
            {props.required ? <span className="ml-1 text-danger">*</span> : null}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            "w-full rounded-card border-2 border-border-default-medium bg-neutral-primary-soft px-5 py-3 text-body text-heading shadow-pencil-xs outline-none transition-colors placeholder:text-body-subtle",
            "hover:border-border-default-strong",
            "focus:border-brand focus:shadow-[0_0_0_4px_theme(colors.brand-soft),2px_2px_0_0_theme(colors.dark)]",
            hasError &&
              "border-danger focus:border-danger focus:shadow-[0_0_0_4px_theme(colors.danger-medium),2px_2px_0_0_theme(colors.dark)]",
            "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-fg-disabled",
            "resize-y",
            className,
          )}
          aria-invalid={hasError || undefined}
          {...props}
        />
        {error ? (
          <p className="mt-1 ml-4 text-tiny text-fg-danger">{error}</p>
        ) : hint ? (
          <p className="mt-1 ml-4 text-tiny text-body-subtle">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
