"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarProps {
  items: SidebarItem[];
  brand?: string;
}

export function Sidebar({ items, brand = "Trac Nghiem" }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="hidden h-full w-68 shrink-0 flex-col border-r-2 border-dashed border-border-default bg-neutral-primary-soft md:flex">
      <div className="border-b-2 border-dashed border-border-default px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3 no-underline">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-dark bg-brand text-white shadow-pencil-xs">
            <span className="font-handrawn text-leading">T</span>
          </span>
          <span className="font-handrawn text-display-6 text-heading">{brand}</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-pill px-4 py-2.5 text-body font-medium no-underline transition-colors",
                    active
                      ? "border-2 border-border-brand-subtle bg-brand-softer text-fg-brand-strong"
                      : "text-heading hover:bg-neutral-tertiary",
                  )}
                >
                  {item.icon ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center">
                      {item.icon}
                    </span>
                  ) : null}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t-2 border-dashed border-border-default p-3">
        <div className="rounded-card border-2 border-dashed border-border-brand-subtle bg-brand-softer p-4 shadow-pencil-sm">
          <p className="mb-1 font-handrawn text-body text-fg-brand-strong">Cần trợ giúp?</p>
          <p className="text-tiny text-fg-brand-strong/80">
            Liên hệ quản trị viên nếu gặp sự cố trong quá trình sử dụng.
          </p>
        </div>
      </div>
    </aside>
  );
}
