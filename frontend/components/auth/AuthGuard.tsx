"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { Role } from "@/lib/constants";

interface AuthGuardProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ allowedRoles, children, fallback }: AuthGuardProps) {
  const { user, token, isHydrated } = useAuthStore();
  const router = useRouter();

  const ready =
    isHydrated && !!user && !!token && (!allowedRoles || allowedRoles.includes(user.role));

  React.useEffect(() => {
    if (!isHydrated) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, token, allowedRoles, router]);

  if (!ready) {
    return fallback ? <>{fallback}</> : <FullPageSpinner label="Đang tải..." />;
  }
  return <>{children}</>;
}
