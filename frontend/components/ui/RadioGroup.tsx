"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, "asChild"> {
  options: RadioOption[];
  orientation?: "horizontal" | "vertical";
  error?: boolean;
}

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, options, orientation = "vertical", error, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(
      "flex gap-3",
      orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
      className,
    )}
    {...props}
  >
    {options.map((opt) => {
      const itemId = `radio-${opt.value}`;
      return (
        <div key={opt.value} className="flex items-start gap-3">
          <RadioGroupPrimitive.Item
            id={itemId}
            value={opt.value}
            disabled={opt.disabled}
            className={cn(
              "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border-default-medium bg-neutral-primary-soft shadow-pencil-2xs outline-none transition-colors",
              "hover:border-border-default-strong",
              "focus-visible:ring-4 focus-visible:ring-brand-soft",
              "data-[state=checked]:border-brand",
              error && "border-danger",
            )}
          >
            <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
              <span className="block h-2.5 w-2.5 rounded-full bg-brand" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
          <label htmlFor={itemId} className="cursor-pointer text-body text-heading">
            {opt.label}
            {opt.description ? (
              <span className="block text-small text-body-subtle">{opt.description}</span>
            ) : null}
          </label>
        </div>
      );
    })}
  </RadioGroupPrimitive.Root>
));
RadioGroup.displayName = "RadioGroup";
