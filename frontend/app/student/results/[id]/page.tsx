"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { ROLES, type OptionLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { ExamResult } from "@/types/result";
import type { ApiError } from "@/types/api";

const optionLabelName: Record<OptionLabel, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [data, setData] = React.useState<ExamResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = (await api.get(`/student/results/${id}`)) as ExamResult;
        setData(res);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message ?? "Không thể tải kết quả");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

  if (error || !data) {
    return (
      <AuthGuard allowedRoles={[ROLES.STUDENT]}>
        <AppShellWrapper role={ROLES.STUDENT}>
          <PageHeader
            title="Kết quả"
            actions={
              <Button
                variant="secondary"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => router.push("/student/results")}
              >
                Quay lại
              </Button>
            }
          />
          <div className="mt-6">
            <ErrorState description={error ?? "Không tìm thấy kết quả"} onRetry={() => router.push("/student/results")} />
          </div>
        </AppShellWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={[ROLES.STUDENT]}>
      <AppShellWrapper role={ROLES.STUDENT}>
        <PageHeader
          eyebrow="Kết quả"
          title={data.examTitle ?? "Chi tiết bài thi"}
          description={`Nộp lúc: ${formatDateTime(data.submittedAt)}`}
          actions={
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => router.push("/student/results")}
            >
              Quay lại
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="brand" padding="md">
            <p className="text-tiny uppercase tracking-wider text-fg-brand-strong">Điểm</p>
            <p className="mt-2 font-handrawn text-display-3 text-heading">{data.score?.toFixed?.(2) ?? "0.00"}</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Số câu đúng</p>
            <p className="mt-2 font-handrawn text-display-4 text-fg-success-strong">
              {data.totalCorrect}
            </p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Số câu sai</p>
            <p className="mt-2 font-handrawn text-display-4 text-fg-danger-strong">
              {data.totalWrong}
            </p>
          </Card>
        </div>

        <div className="mt-4">
          {data.passed ? (
            <Badge variant="success" size="lg" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              Chúc mừng — bạn đã đạt!
            </Badge>
          ) : (
            <Badge variant="danger" size="lg" leftIcon={<XCircle className="h-3.5 w-3.5" />}>
              Bạn chưa đạt. Hãy luyện tập thêm nhé!
            </Badge>
          )}
        </div>

        <Card variant="default" padding="md" className="mt-6">
          <h3 className="mb-4 font-handrawn text-display-6 text-heading">Chi tiết từng câu</h3>
          <div className="space-y-3">
            {data.answers.map((ans, idx) => (
              <div
                key={ans.questionId}
                className="flex items-center justify-between gap-3 rounded-card border-2 border-dashed border-border-default bg-neutral-primary-soft p-3"
              >
                <div className="flex items-center gap-3">
                  {ans.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-fg-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-fg-danger" />
                  )}
                  <span className="text-small font-medium">Câu {idx + 1}</span>
                </div>
                <div className="text-small">
                  Bạn chọn:{" "}
                  <b className="text-heading">
                    {ans.selectedOption ? optionLabelName[ans.selectedOption] : "—"}
                  </b>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </AppShellWrapper>
    </AuthGuard>
  );
}
