"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, XCircle, Trash2 } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExamStatusBadge } from "@/components/exam/ExamStatusBadge";
import { api } from "@/lib/api";
import { ROLES, EXAM_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { Exam } from "@/types/exam";
import type { Subject } from "@/types/subject";
import type { ApiError } from "@/types/api";

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message } = App.useApp();
  const [exam, setExam] = React.useState<Exam | null>(null);
  const [subject, setSubject] = React.useState<Subject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.get(`/exams/${id}`)) as Exam;
      setExam(res);
      try {
        const s = (await api.get(`/subjects/${res.subjectId}`)) as Subject;
        setSubject(s);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Không thể tải đề thi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await api.post(`/exams/${id}/publish`);
      message.success("Đã xuất bản đề thi");
      fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      message.error(apiErr.message ?? "Xuất bản thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.post(`/exams/${id}/close`);
      message.success("Đã đóng đề thi");
      fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      message.error(apiErr.message ?? "Đóng thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/exams/${id}`);
      message.success("Đã xóa đề thi");
      router.push("/teacher/exams");
    } catch (err) {
      const apiErr = err as ApiError;
      message.error(apiErr.message ?? "Xóa thất bại");
    } finally {
      setActionLoading(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <AppShellWrapper role={ROLES.TEACHER}>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner size="lg" label="Đang tải..." />
          </div>
        </AppShellWrapper>
      </AuthGuard>
    );
  }

  if (error || !exam) {
    return (
      <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <AppShellWrapper role={ROLES.TEACHER}>
          <PageHeader
            title="Chi tiết đề thi"
            actions={
              <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.back()}>
                Quay lại
              </Button>
            }
          />
          <div className="mt-6">
            <ErrorState description={error ?? "Không tìm thấy đề thi"} onRetry={fetchData} />
          </div>
        </AppShellWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
      <AppShellWrapper role={ROLES.TEACHER}>
        <PageHeader
          eyebrow="Đề thi"
          title={exam.title}
          description={subject ? `Môn: ${subject.name}` : undefined}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => router.push("/teacher/exams")}
              >
                Quay lại
              </Button>
              {exam.status === EXAM_STATUS.DRAFT ? (
                <Button
                  variant="brand"
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={handlePublish}
                  loading={actionLoading}
                >
                  Xuất bản
                </Button>
              ) : null}
              {exam.status === EXAM_STATUS.PUBLISHED ? (
                <Button
                  variant="warning"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={handleClose}
                  loading={actionLoading}
                >
                  Đóng đề
                </Button>
              ) : null}
              {exam.status === EXAM_STATUS.DRAFT ? (
                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleting(true)}
                >
                  Xóa
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Trạng thái</p>
            <div className="mt-2">
              <ExamStatusBadge status={exam.status} />
            </div>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Số câu hỏi</p>
            <p className="mt-2 font-handrawn text-display-4 text-heading">
              {exam.totalQuestions ?? exam.questionIds?.length ?? 0}
            </p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Thời lượng</p>
            <p className="mt-2 font-handrawn text-display-4 text-heading">{exam.duration} phút</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Bắt đầu</p>
            <p className="mt-2 text-body font-medium">{formatDateTime(exam.startTime)}</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Kết thúc</p>
            <p className="mt-2 text-body font-medium">{formatDateTime(exam.endTime)}</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-tiny uppercase tracking-wider text-body-subtle">Tổng điểm</p>
            <p className="mt-2 font-handrawn text-display-4 text-heading">{exam.totalPoints}</p>
          </Card>
        </div>

        <Card variant="default" padding="md" className="mt-6">
          <h3 className="mb-3 font-handrawn text-display-6 text-heading">Cấu hình</h3>
          <div className="flex flex-wrap gap-2">
            {exam.shuffleQuestions ? (
              <Badge variant="success">Xáo trộn câu hỏi</Badge>
            ) : (
              <Badge variant="gray">Không xáo trộn câu hỏi</Badge>
            )}
            {exam.shuffleOptions ? (
              <Badge variant="success">Xáo trộn đáp án</Badge>
            ) : (
              <Badge variant="gray">Không xáo trộn đáp án</Badge>
            )}
            <Badge variant="brand">
              {exam.assignedClassIds?.length ?? 0} lớp được gán
            </Badge>
          </div>
        </Card>

        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title="Xóa đề thi?"
          description={`Bạn có chắc muốn xóa đề "${exam.title}"? Hành động này không thể hoàn tác.`}
          variant="danger"
          confirmText="Xóa"
          loading={actionLoading}
          onConfirm={handleDelete}
        />
      </AppShellWrapper>
    </AuthGuard>
  );
}
