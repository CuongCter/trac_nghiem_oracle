"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen, CheckCircle2, ListChecks } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { ROLES, EXAM_STATUS, type ExamStatus } from "@/lib/constants";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { Exam } from "@/types/exam";
import type { ApiError } from "@/types/api";

function examState(exam: Exam):
  | { label: string; variant: "brand" | "success" | "warning" | "gray" | "danger" }
  | null {
  const now = Date.now();
  const start = exam.startTime ? new Date(exam.startTime).getTime() : 0;
  const end = exam.endTime ? new Date(exam.endTime).getTime() : Infinity;
  if (exam.status === EXAM_STATUS.DRAFT) {
    return { label: "Chưa xuất bản", variant: "gray" };
  }
  if (exam.status === EXAM_STATUS.CLOSED || now > end) {
    return { label: "Đã đóng", variant: "danger" };
  }
  if (now < start) {
    return { label: "Chưa mở", variant: "warning" };
  }
  return { label: "Đang mở", variant: "success" };
}

export default function StudentExamsPage() {
  const [data, setData] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.get("/student/exams")) as Exam[];
      setData(res);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Không thể tải danh sách bài thi");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <AuthGuard allowedRoles={[ROLES.STUDENT]}>
      <AppShellWrapper role={ROLES.STUDENT}>
        <PageHeader
          eyebrow="Học tập"
          title="Bài thi của tôi"
          description="Danh sách các bài thi được giao cho lớp của bạn."
        />

        {error ? (
          <div className="mt-6">
            <ErrorState description={error} onRetry={fetchData} />
          </div>
        ) : loading ? (
          <div className="mt-12 flex justify-center">
            <Spinner size="lg" label="Đang tải..." />
          </div>
        ) : data.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Chưa có bài thi nào"
              description="Khi giáo viên giao đề, các bài thi sẽ xuất hiện tại đây."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((exam) => {
              const state = examState(exam);
              const canStart = state?.label === "Đang mở";
              return (
                <Card
                  key={exam._id}
                  variant="interactive"
                  padding="md"
                  className="flex h-full flex-col"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="font-handrawn text-display-6 text-heading line-clamp-2">
                      {exam.title}
                    </h3>
                    {state ? (
                      <Badge variant={state.variant as "brand"} size="lg">
                        {state.label}
                      </Badge>
                    ) : null}
                  </div>
                  <dl className="mb-4 space-y-2 text-small text-body">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-body-subtle" />
                      <span>
                        {exam.totalQuestions ?? exam.questionIds?.length ?? 0} câu
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-body-subtle" />
                      <span>{formatDuration(exam.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-body-subtle" />
                      <span>
                        Mở: {formatDateTime(exam.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-body-subtle" />
                      <span>Đóng: {formatDateTime(exam.endTime)}</span>
                    </div>
                  </dl>
                  <div className="mt-auto flex justify-end">
                    {canStart ? (
                      <Link href={`/student/exams/${exam._id}/start`} className="no-underline">
                        <Button variant="brand" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Vào thi
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="secondary" disabled>
                        Chưa thể làm
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AppShellWrapper>
    </AuthGuard>
  );
}
