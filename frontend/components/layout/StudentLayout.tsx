"use client";

import * as React from "react";
import { ClipboardList, History } from "lucide-react";
import { Sidebar, type SidebarItem } from "./Sidebar";
import { AppHeader } from "./AppHeader";

const items: SidebarItem[] = [
  {
    label: "Bài thi của tôi",
    href: "/student/exams",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: "Lịch sử kết quả",
    href: "/student/results",
    icon: <History className="h-5 w-5" />,
  },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-primary-soft">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title="Không gian học viên" />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
