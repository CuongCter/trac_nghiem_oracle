"use client";

import * as React from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { Sidebar, type SidebarItem } from "./Sidebar";
import { AppHeader } from "./AppHeader";

const items: SidebarItem[] = [
  { label: "Người dùng", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  {
    label: "Môn học",
    href: "/admin/subjects",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: "Lớp học",
    href: "/admin/classes",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    label: "Đề thi",
    href: "/admin/exams",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: "Báo cáo",
    href: "/admin/reports",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-primary-soft">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title="Quản trị hệ thống" />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
