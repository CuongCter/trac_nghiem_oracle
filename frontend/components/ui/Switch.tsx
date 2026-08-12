"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const reactId = React.useId();
  const switchId = id ?? `switch-${reactId}`;
  return (
    <div className="flex items-center justify-between gap-3">
      {label || description ? (
        <div className="flex flex-col">
          {label ? (
            <label htmlFor={switchId} className="cursor-pointer text-body font-medium text-heading">
              {label}
            </label>
          ) : null}
          {description ? (
            <p className="text-small text-body-subtle">{description}</p>
          ) : null}
        </div>
      ) : null}
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          "relative h-6.5 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-border-default bg-neutral-quaternary shadow-pencil-2xs outline-none transition-colors",
          "data-[state=checked]:border-border-dark data-[state=checked]:bg-brand",
          "focus-visible:ring-4 focus-visible:ring-brand-soft",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block h-4.5 w-4.5 translate-x-0.5 rounded-full border-2 border-border-dark bg-neutral-primary-soft transition-transform",
            "data-[state=checked]:translate-x-5",
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
});
Switch.displayName = "Switch";
