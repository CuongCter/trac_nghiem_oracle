"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

type TabsVariant = "underline" | "pills" | "fullWidth";

interface TabsContextValue {
  variant: TabsVariant;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);
function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  variant?: TabsVariant;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = "underline",
  className,
  children,
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ variant }}>
      <TabsPrimitive.Root
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        className={cn("w-full", className)}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

const listVariantClasses: Record<TabsVariant, string> = {
  underline: "border-b-2 border-border-default",
  pills: "flex flex-wrap gap-2",
  fullWidth: "flex gap-2",
};

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  const { variant } = useTabsContext();
  return (
    <TabsPrimitive.List
      className={cn(
        "flex",
        variant === "underline" && "gap-1",
        variant === "fullWidth" && "gap-2 w-full",
        listVariantClasses[variant],
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

const triggerVariantClasses: Record<TabsVariant, string> = {
  underline: cn(
    "relative px-4 py-2.5 text-small font-medium text-body-subtle",
    "hover:text-heading",
    "data-[state=active]:text-fg-brand data-[state=active]:after:absolute data-[state=active]:after:inset-x-4 data-[state=active]:after:-bottom-0.5 data-[state=active]:after:h-0.75 data-[state=active]:after:bg-brand",
  ),
  pills: cn(
    "rounded-pill border-2 border-transparent px-5 py-2 text-small font-medium text-body-subtle",
    "hover:bg-neutral-tertiary hover:text-heading",
    "data-[state=active]:border-border-dark data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-pencil-xs",
  ),
  fullWidth: cn(
    "flex-1 rounded-pill border-2 border-border-default bg-neutral-primary-medium px-4 py-2.5 text-small font-medium text-body-subtle shadow-pencil-xs",
    "hover:bg-neutral-tertiary hover:text-heading",
    "data-[state=active]:border-border-dark data-[state=active]:bg-brand data-[state=active]:text-white",
  ),
};

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { variant } = useTabsContext();
  return (
    <TabsPrimitive.Trigger value={value} className={cn(triggerVariantClasses[variant], className)}>
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn("mt-6 animate-fade-in focus:outline-none", className)}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
