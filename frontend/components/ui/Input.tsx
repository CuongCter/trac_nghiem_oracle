"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  id?: string;
}

let inputCounter = 0;
const useId = React.useId;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `input-${reactId ?? ++inputCounter}`;
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
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-body">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "h-11 w-full rounded-pill border-2 border-border-default-medium bg-neutral-primary-soft px-5 text-body text-heading shadow-pencil-xs outline-none transition-colors placeholder:text-body-subtle",
              "hover:border-border-default-strong",
              "focus:border-brand focus:shadow-[0_0_0_4px_theme(colors.brand-soft),2px_2px_0_0_theme(colors.dark)]",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              hasError &&
                "border-danger focus:border-danger focus:shadow-[0_0_0_4px_theme(colors.danger-medium),2px_2px_0_0_theme(colors.dark)]",
              "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-fg-disabled",
              className,
            )}
            aria-invalid={hasError || undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon ? (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-body">
              {rightIcon}
            </span>
          ) : null}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 ml-4 text-tiny text-fg-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1 ml-4 text-tiny text-body-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
