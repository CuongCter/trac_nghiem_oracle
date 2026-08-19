"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ExamForm } from "@/components/exam/ExamForm";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import type { ClassEntity, ExamInput } from "@/types/exam";
import type { Subject } from "@/types/subject";
import type { ApiError } from "@/types/api";
import { useRouter } from "next/navigation";

export default function CreateExamPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [classes, setClasses] = React.useState<ClassEntity[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const [s, c] = await Promise.all([
          api.get("/subjects/all") as Promise<Subject[]>,
          api.get("/classes") as Promise<ClassEntity[]>,
        ]);
        setSubjects(Array.isArray(s) ? s : []);
        setClasses(Array.isArray(c) ? c : []);
      } catch {
        message.error("Không thể tải môn học / lớp học");
      } finally {
        setLoading(false);
      }
    })();
  }, [message]);

  const handleSubmit = async (values: ExamInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = (await api.post("/exams", values)) as { _id: string };
      message.success("Tạo đề thi thành công");
      router.push(`/teacher/exams/${res._id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Tạo đề thi thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
      <AppShellWrapper role={ROLES.TEACHER}>
        <PageHeader
          eyebrow="Đề thi"
          title="Tạo đề thi mới"
          description="Cấu hình thông tin, khung giờ, bộ câu hỏi và lớp được gán."
          actions={
            <Button
              variant="secondary"
              onClick={() => router.push("/teacher/exams")}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Danh sách đề thi
            </Button>
          }
        />

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Spinner size="lg" label="Đang tải dữ liệu..." />
          </div>
        ) : subjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Chưa có môn học"
              description="Bạn cần tạo ít nhất một môn học trước khi tạo đề thi."
            />
          </div>
        ) : (
          <div className="mt-6">
            <ExamForm
              subjects={subjects}
              classes={classes}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          </div>
        )}
      </AppShellWrapper>
    </AuthGuard>
  );
}
