"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Clock, ListChecks, BookOpen, ShieldCheck } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { Exam } from "@/types/exam";
import type { StartExamResponse } from "@/types/attempt";
import type { ApiError } from "@/types/api";

export default function ExamStartPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message } = App.useApp();
  const [exam, setExam] = React.useState<Exam | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = (await api.get(`/student/exams`)) as Exam[];
        const found = res.find((e) => e._id === id);
        if (!found) {
          setError("Không tìm thấy bài thi hoặc bạn chưa được giao.");
        } else {
          setExam(found);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message ?? "Không thể tải thông tin bài thi");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = (await api.post(`/student/exams/${id}/start`)) as StartExamResponse;
      sessionStorage.setItem(`exam:${id}:start`, JSON.stringify(res));
      router.push(`/student/exams/${id}/doing`);
    } catch (err) {
      const apiErr = err as ApiError;
      message.error(apiErr.message ?? "Không thể bắt đầu bài thi");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={[ROLES.STUDENT]}>
        <AppShellWrapper role={ROLES.STUDENT}>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </AppShellWrapper>
      </AuthGuard>
    );
  }

  if (error || !exam) {
    return (
      <AuthGuard allowedRoles={[ROLES.STUDENT]}>
        <AppShellWrapper role={ROLES.STUDENT}>
          <PageHeader
            title="Bắt đầu bài thi"
            actions={
              <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/student/exams")}>
                Quay lại
              </Button>
            }
          />
          <div className="mt-6">
            <ErrorState description={error ?? "Không tìm thấy bài thi"} onRetry={() => router.push("/student/exams")} />
          </div>
        </AppShellWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={[ROLES.STUDENT]}>
      <AppShellWrapper role={ROLES.STUDENT}>
        <PageHeader
          eyebrow="Sẵn sàng"
          title={exam.title}
          description="Vui lòng đọc kỹ các điều kiện bên dưới trước khi bắt đầu."
          actions={
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => router.push("/student/exams")}
            >
              Quay lại
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-fg-brand" />
              <p className="text-small text-body-subtle">Số câu hỏi</p>
            </div>
            <p className="mt-2 font-handrawn text-display-4 text-heading">
              {exam.totalQuestions ?? exam.questionIds?.length ?? 0}
            </p>
          </Card>
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-fg-warning" />
              <p className="text-small text-body-subtle">Thời lượng</p>
            </div>
            <p className="mt-2 font-handrawn text-display-4 text-heading">
              {formatDuration(exam.duration)}
            </p>
          </Card>
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-fg-success" />
              <p className="text-small text-body-subtle">Khung giờ</p>
            </div>
            <p className="mt-1 text-small text-heading">{formatDateTime(exam.startTime)}</p>
            <p className="text-tiny text-body-subtle">đến {formatDateTime(exam.endTime)}</p>
          </Card>
        </div>

        <Card variant="default" padding="lg" className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-fg-brand" />
            <h3 className="font-handrawn text-display-6 text-heading">Điều kiện &amp; quy chế</h3>
          </div>
          <ul className="space-y-3 text-body">
            <li>• Đáp án được lưu tự động sau mỗi lần chọn.</li>
            <li>• Hết giờ hệ thống sẽ tự động nộp bài.</li>
            <li>
              • Rời tab quá <b>3 lần</b> hệ thống sẽ tự động nộp bài.
            </li>
            <li>• Bạn chỉ có một lần làm bài cho mỗi đề.</li>
          </ul>
          <Alert variant="warning" className="mt-4">
            Hãy đảm bảo kết nối internet ổn định trước khi bấm <b>Bắt đầu</b>.
          </Alert>
          <div className="mt-6 flex justify-end">
            <Button
              variant="brand"
              size="lg"
              leftIcon={<Play className="h-4 w-4" />}
              onClick={handleStart}
              loading={starting}
            >
              Bắt đầu làm bài
            </Button>
          </div>
        </Card>
      </AppShellWrapper>
    </AuthGuard>
  );
}
