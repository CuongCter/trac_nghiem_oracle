"use client";

import * as React from "react";
import { ListChecks, FileQuestion, BarChart3 } from "lucide-react";
import { Sidebar, type SidebarItem } from "./Sidebar";
import { AppHeader } from "./AppHeader";

const items: SidebarItem[] = [
  {
    label: "Ngân hàng câu hỏi",
    href: "/teacher/questions",
    icon: <FileQuestion className="h-5 w-5" />,
  },
  {
    label: "Đề thi của tôi",
    href: "/teacher/exams",
    icon: <ListChecks className="h-5 w-5" />,
  },
  {
    label: "Báo cáo điểm",
    href: "/teacher/reports",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-primary-soft">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title="Không gian giáo viên" />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
