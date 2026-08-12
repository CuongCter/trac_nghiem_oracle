"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "asChild"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const reactId = React.useId();
  const checkboxId = id ?? `checkbox-${reactId}`;
  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border-default-medium bg-neutral-primary-soft shadow-pencil-2xs outline-none transition-colors",
          "hover:border-border-default-strong",
          "focus-visible:ring-4 focus-visible:ring-brand-soft",
          "data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-white",
          error && "border-danger",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label || description ? (
        <div className="flex flex-col">
          {label ? (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-body font-medium text-heading"
            >
              {label}
            </label>
          ) : null}
          {description ? (
            <p className="text-small text-body-subtle">{description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
Checkbox.displayName = "Checkbox";
