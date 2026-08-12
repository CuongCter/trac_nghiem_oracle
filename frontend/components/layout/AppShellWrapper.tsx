"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/authStore";
import AdminLayout from "./AdminLayout";
import TeacherLayout from "./TeacherLayout";
import StudentLayout from "./StudentLayout";
import { ROLES, type Role } from "@/lib/constants";
import { FullPageSpinner } from "@/components/ui/Spinner";

interface AppShellWrapperProps {
  role: Role;
  children: React.ReactNode;
}

/** Pick the right layout for the current user's role. */
export default function AppShellWrapper({ role, children }: AppShellWrapperProps) {
  const { isHydrated } = useAuthStore();
  if (!isHydrated) return <FullPageSpinner />;
  if (role === ROLES.ADMIN) return <AdminLayout>{children}</AdminLayout>;
  if (role === ROLES.TEACHER) return <TeacherLayout>{children}</TeacherLayout>;
  if (role === ROLES.STUDENT) return <StudentLayout>{children}</StudentLayout>;
  return <FullPageSpinner label="Vai trò không hợp lệ" />;
}
