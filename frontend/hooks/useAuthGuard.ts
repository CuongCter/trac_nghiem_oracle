"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ROLES, type Role } from "@/lib/constants";

interface UseAuthGuardOptions {
  allowedRoles?: Role[];
  redirectTo?: string;
}

/**
 * Client-side route guard.
 * Returns `{ user, ready }` — components should render a loader when !ready.
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { allowedRoles, redirectTo = "/login" } = options;
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!token || !user) {
      router.replace(redirectTo);
      return;
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, token, allowedRoles, redirectTo, router]);

  const ready =
    isHydrated && !!user && !!token && (!allowedRoles || allowedRoles.includes(user.role));

  return { user, ready, isHydrated, role: user?.role };
}
