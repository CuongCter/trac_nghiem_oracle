"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type AvatarSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
type AvatarShape = "circle" | "square";

const sizeMap: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: "h-5 w-5", text: "text-tiny" },
  sm: { box: "h-7 w-7", text: "text-tiny" },
  base: { box: "h-9 w-9", text: "text-small" },
  lg: { box: "h-12 w-12", text: "text-body" },
  xl: { box: "h-15 w-15", text: "text-leading" },
  "2xl": { box: "h-18 w-18", text: "text-leading" },
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
}

function initialsFromName(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, src, alt, name, size = "base", shape = "circle", ...props }, ref) => {
    const sizing = sizeMap[size];
    const isCircle = shape === "circle";
    return (
      <span
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden border-2 border-border-dark bg-neutral-primary-medium font-medium text-heading",
          sizing.box,
          sizing.text,
          isCircle ? "rounded-full" : "rounded-card",
          className,
        )}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? name ?? "avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initialsFromName(name)}</span>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";
