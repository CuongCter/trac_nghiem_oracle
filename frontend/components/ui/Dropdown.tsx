"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownPortal = DropdownMenuPrimitive.Portal;
export const DropdownSub = DropdownMenuPrimitive.Sub;
export const DropdownRadioGroup = DropdownMenuPrimitive.RadioGroup;

export function DropdownContent({
  className,
  align = "end",
  sideOffset = 8,
  children,
}: {
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] rounded-card border-2 border-dashed border-dark bg-neutral-primary-medium p-3 shadow-pencil-md",
          "animate-fade-in",
          className,
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  leftIcon,
  rightIcon,
  inset,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 text-small font-medium text-body outline-none transition-colors data-[highlighted]:bg-neutral-tertiary data-[highlighted]:text-heading data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {leftIcon ? (
        <span className="inline-flex h-4 w-4 items-center justify-center">{leftIcon}</span>
      ) : null}
      <span className="flex-1">{children}</span>
      {rightIcon ? (
        <span className="inline-flex h-4 w-4 items-center justify-center">{rightIcon}</span>
      ) : null}
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 text-small font-medium text-body outline-none data-[highlighted]:bg-neutral-tertiary",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-brand" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownSeparator({ className }: { className?: string }) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("my-1 h-px border-t-2 border-dashed border-border-default", className)}
    />
  );
}

export function DropdownLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-3 py-1.5 font-handrawn text-body text-heading",
        className,
      )}
    >
      {children}
    </DropdownMenuPrimitive.Label>
  );
}
