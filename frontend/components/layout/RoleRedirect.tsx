"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/constants";
import { FullPageSpinner } from "@/components/ui/Spinner";

/**
 * Redirects the user to the default route for their role.
 * Mount this in pages where role-agnostic routing is required
 * (e.g. /dashboard).
 */
export function RoleRedirect() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(DEFAULT_ROUTE_BY_ROLE[user.role]);
  }, [isHydrated, user, router]);

  return <FullPageSpinner label="Đang chuyển hướng..." />;
}
