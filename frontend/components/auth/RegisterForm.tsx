"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { registerRequest } from "@/lib/auth";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/stores/authStore";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/constants";
import type { ApiError } from "@/types/api";

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    setLoading(true);
    try {
      const res = await registerRequest({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: "STUDENT",
      });
      const data = res as unknown as {
        user: import("@/types/user").User;
        token: string;
      };
      setAuth(data.user, data.token);
      router.replace(DEFAULT_ROUTE_BY_ROLE[data.user.role] ?? "/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Đăng ký thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="danger" title="Đăng ký thất bại">
          {error}
        </Alert>
      ) : null}

      <Input
        label="Họ và tên"
        autoComplete="name"
        placeholder="Nguyễn Văn A"
        leftIcon={<UserIcon className="h-4 w-4" />}
        error={errors.fullName?.message}
        required
        {...register("fullName")}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="ban@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        required
        {...register("email")}
      />

      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        placeholder="Tối thiểu 6 ký tự"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        required
        {...register("password")}
      />

      <Input
        label="Xác nhận mật khẩu"
        type="password"
        autoComplete="new-password"
        placeholder="Nhập lại mật khẩu"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.confirmPassword?.message}
        required
        {...register("confirmPassword")}
      />

      <Button type="submit" variant="brand" size="lg" loading={loading} fullWidth>
        Tạo tài khoản
      </Button>

      <p className="text-center text-small text-body-subtle">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-fg-brand">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
