"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { loginRequest } from "@/lib/auth";
import { loginSchema, type LoginInput } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/stores/authStore";
import { DEFAULT_ROUTE_BY_ROLE, STORAGE_KEYS } from "@/lib/constants";
import type { ApiError } from "@/types/api";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginRequest(values.email, values.password);
      const data = res as unknown as {
        user: import("@/types/user").User;
        token: string;
      };
      setAuth(data.user, data.token);
      router.replace(DEFAULT_ROUTE_BY_ROLE[data.user.role] ?? "/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Đăng nhập thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="danger" title="Đăng nhập thất bại">
          {error}
        </Alert>
      ) : null}

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
        type={showPwd ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••"
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="inline-flex h-5 w-5 items-center justify-center text-body"
            aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        error={errors.password?.message}
        required
        {...register("password")}
      />

      <Button type="submit" variant="brand" size="lg" loading={loading} fullWidth>
        Đăng nhập
      </Button>

      <p className="text-center text-small text-body-subtle">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-fg-brand">
          Đăng ký ngay
        </Link>
      </p>
      <p className="text-center text-tiny text-body-subtle">
        Dữ liệu được lưu cục bộ (key <code>{STORAGE_KEYS.AUTH}</code>)
      </p>
    </form>
  );
}
