"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { App } from "antd";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types/user";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const errorParam = url.searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
      return;
    }
    if (!token) {
      setError("Thiếu token xác thực");
      return;
    }
    void (async () => {
      try {
        const res = (await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })) as User;
        setAuth(res, token);
        message.success("Đăng nhập thành công");
        router.push("/dashboard");
      } catch (e: unknown) {
        const err = e as { message?: string };
        setError(err?.message ?? "Đăng nhập thất bại");
      }
    })();
  }, [router, setAuth, message]);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageHeader
        title="Đang xử lý đăng nhập..."
        actions={
          <Link href="/login" className="no-underline">
            <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Về trang đăng nhập
            </Button>
          </Link>
        }
      />
      <Card variant="default" padding="lg" className="mt-6">
        {error ? (
          <Alert variant="danger" title="Lỗi">
            {error}
          </Alert>
        ) : (
          <p className="text-body">Đang xác thực với máy chủ...</p>
        )}
      </Card>
    </div>
  );
}
