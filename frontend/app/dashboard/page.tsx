import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleRedirect } from "@/components/layout/RoleRedirect";
import { ALL_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Dashboard — Trac Nghiem",
};

export default function DashboardPage() {
  return (
    <AuthGuard allowedRoles={[...ALL_ROLES]}>
      <RoleRedirect />
    </AuthGuard>
  );
}
