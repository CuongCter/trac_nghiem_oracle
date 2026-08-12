"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { ROLES } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function AppHeader({ title }: { title?: string }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b-2 border-dashed border-border-default bg-neutral-primary-soft/90 px-4 backdrop-blur md:px-6">
      <Link href="/dashboard" className="flex items-center gap-3 no-underline">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-dark bg-brand text-white shadow-pencil-xs">
          <span className="font-handrawn text-leading">T</span>
        </span>
        <span className="font-handrawn text-display-6 text-heading">
          Trac Nghiem
        </span>
      </Link>

      {title ? (
        <h2 className="hidden font-handrawn text-display-6 text-heading md:block">
          {title}
        </h2>
      ) : null}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-pill border-2 border-dashed border-border-default bg-neutral-primary-medium px-3 py-1.5 shadow-pencil-xs transition-transform",
              "hover:-translate-x-px hover:-translate-y-px hover:shadow-pencil-sm",
            )}
          >
            <Avatar name={user?.fullName} size="sm" />
            <span className="hidden text-small font-medium text-heading sm:inline">
              {user?.fullName ?? "Người dùng"}
            </span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 w-56 rounded-card border-2 border-dashed border-dark bg-neutral-primary-medium p-3 shadow-pencil-md"
          >
            <div className="mb-2 border-b-2 border-dashed border-border-default pb-2">
              <p className="font-handrawn text-body text-heading">
                {user?.fullName}
              </p>
              <p className="text-tiny text-body-subtle">{user?.email}</p>
              <p className="mt-1 text-tiny font-medium uppercase tracking-wide text-fg-brand">
                {user?.role}
              </p>
            </div>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 text-small outline-none data-[highlighted]:bg-neutral-tertiary"
              onSelect={() => router.push("/profile")}
            >
              <UserIcon className="h-4 w-4" /> Hồ sơ
            </DropdownMenu.Item>
            {user?.role === ROLES.ADMIN ? (
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 text-small outline-none data-[highlighted]:bg-neutral-tertiary"
                onSelect={() => router.push("/admin/reports")}
              >
                <Settings className="h-4 w-4" /> Báo cáo
              </DropdownMenu.Item>
            ) : null}
            <DropdownMenu.Separator className="my-2 h-px border-t-2 border-dashed border-border-default" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 text-small text-fg-danger outline-none data-[highlighted]:bg-danger-soft"
              onSelect={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
