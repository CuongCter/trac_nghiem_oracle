"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAuthStore } from "@/stores/authStore";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/auth.schema";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/constants";
import type { ApiError } from "@/types/api";
import { api } from "@/lib/api";

const roleLabel: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [message, setMessage] = React.useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordInput) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setMessage({ type: "success", text: "Đổi mật khẩu thành công." });
      reset();
    } catch (err) {
      const apiErr = err as ApiError;
      setMessage({
        type: "danger",
        text: apiErr.message ?? "Đổi mật khẩu thất bại, vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  const role = user.role as Role;

  return (
    <AuthGuard allowedRoles={["ADMIN", "TEACHER", "STUDENT"]}>
      <AppShellWrapper role={role}>
        <PageHeader
          eyebrow="Hồ sơ"
          title="Thông tin cá nhân"
          description="Quản lý thông tin tài khoản và mật khẩu của bạn."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
            >
              Quay lại
            </Button>
          }
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card variant="default" padding="lg" className="lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <Avatar name={user.fullName} size="2xl" shape="square" />
              <h2 className="mt-4 font-handrawn text-display-5 text-heading">
                {user.fullName}
              </h2>
              <p className="mt-1 text-small text-body-subtle">{user.email}</p>
              <Badge variant="brand" size="lg" className="mt-3">
                {roleLabel[role]}
              </Badge>
              <dl className="mt-6 w-full space-y-2 border-t-2 border-dashed border-border-default pt-4 text-left text-small">
                <div className="flex justify-between">
                  <dt className="text-body-subtle">Ngày tạo</dt>
                  <dd className="font-medium text-heading">{formatDate(user.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-body-subtle">Cập nhật</dt>
                  <dd className="font-medium text-heading">{formatDate(user.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card variant="default" padding="lg" className="lg:col-span-2">
            <h3 className="mb-4 font-handrawn text-display-6 text-heading">
              Đổi mật khẩu
            </h3>
            {message ? (
              <Alert
                variant={message.type}
                className="mb-4"
                dismissible
                onDismiss={() => setMessage(null)}
                title={message.type === "success" ? "Thành công" : "Lỗi"}
              >
                {message.text}
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Mật khẩu hiện tại"
                type="password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
              <Input
                label="Mật khẩu mới"
                type="password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                hint="Tối thiểu 6 ký tự và khác mật khẩu hiện tại"
                {...register("newPassword")}
              />
              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="brand"
                  leftIcon={<Save className="h-4 w-4" />}
                  loading={saving}
                >
                  Cập nhật mật khẩu
                </Button>
              </div>
            </form>
          </Card>
        </div>
        <CardContent className="hidden" />
      </AppShellWrapper>
    </AuthGuard>
  );
}
