"use client";

import * as React from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Send, XCircle } from "lucide-react";
import Link from "next/link";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExamStatusBadge } from "@/components/exam/ExamStatusBadge";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { api } from "@/lib/api";
import { ROLES, EXAM_STATUS, type ExamStatus } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/format";
import type { Exam } from "@/types/exam";
import type { PaginatedData } from "@/types/api";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

export default function TeacherExamsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = React.useState<ExamStatus | undefined>();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [data, setData] = React.useState<PaginatedData<Exam> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Exam | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionId, setActionId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = (await api.get("/exams", { params })) as PaginatedData<Exam>;
      setData(res);
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Không thể tải đề thi");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handlePublish = async (exam: Exam) => {
    setActionId(exam._id);
    try {
      await api.post(`/exams/${exam._id}/publish`);
      message.success("Đã xuất bản đề thi");
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Xuất bản thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleClose = async (exam: Exam) => {
    setActionId(exam._id);
    try {
      await api.post(`/exams/${exam._id}/close`);
      message.success("Đã đóng đề thi");
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Đóng đề thi thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setActionLoading(true);
    try {
      await api.delete(`/exams/${deleting._id}`);
      message.success("Đã xóa đề thi");
      setDeleting(null);
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnsType<Exam> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text: string, record) => (
        <Link
          href={`/teacher/exams/${record._id}`}
          className="font-medium text-heading no-underline hover:underline"
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Số câu",
      key: "totalQuestions",
      width: 100,
      align: "center",
      render: (_, r) => r.totalQuestions ?? r.questionIds?.length ?? 0,
    },
    {
      title: "Thời lượng",
      key: "duration",
      width: 120,
      align: "center",
      render: (_, r) => `${r.duration} phút`,
    },
    {
      title: "Bắt đầu",
      key: "startTime",
      width: 160,
      render: (_, r) => formatDateTime(r.startTime),
    },
    {
      title: "Kết thúc",
      key: "endTime",
      width: 160,
      render: (_, r) => formatDateTime(r.endTime),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      render: (_, r) => <ExamStatusBadge status={r.status} />,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      align: "right",
      render: (_, record) => (
        <DropdownMenu>
          <DropdownTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill border-2 border-dashed border-border-default bg-neutral-primary-medium shadow-pencil-xs transition-transform hover:-translate-x-px hover:-translate-y-px"
              aria-label="Mở menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownLabel>Thao tác</DropdownLabel>
            <DropdownItem
              leftIcon={<Edit className="h-4 w-4" />}
              onSelect={() => router.push(`/teacher/exams/${record._id}`)}
            >
              Xem chi tiết
            </DropdownItem>
            {record.status === EXAM_STATUS.DRAFT ? (
              <DropdownItem
                leftIcon={<Send className="h-4 w-4" />}
                onSelect={() => handlePublish(record)}
              >
                Xuất bản
              </DropdownItem>
            ) : null}
            {record.status === EXAM_STATUS.PUBLISHED ? (
              <DropdownItem
                leftIcon={<XCircle className="h-4 w-4" />}
                onSelect={() => handleClose(record)}
              >
                Đóng đề thi
              </DropdownItem>
            ) : null}
            <DropdownSeparator />
            <DropdownItem
              leftIcon={<Trash2 className="h-4 w-4" />}
              onSelect={() => setDeleting(record)}
              className="text-fg-danger"
              disabled={record.status !== EXAM_STATUS.DRAFT}
            >
              Xóa
            </DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
      <AppShellWrapper role={ROLES.TEACHER}>
        <PageHeader
          eyebrow="Đề thi"
          title="Đề thi của tôi"
          description="Danh sách đề thi đã tạo, quản lý xuất bản &amp; đóng."
          actions={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/teacher/exams/create")}
            >
              Tạo đề thi
            </Button>
          }
        />

        <Card variant="default" padding="md" className="mt-6">
          {error ? (
            <ErrorState description={error} onRetry={fetchData} className="my-4" />
          ) : (
            <>
              <Table<Exam>
                rowKey="_id"
                loading={loading || !!actionId}
                columns={columns}
                dataSource={data?.items ?? []}
                pagination={false}
                locale={{
                  emptyText: (
                    <EmptyState
                      title="Chưa có đề thi nào"
                      description="Hãy tạo đề thi đầu tiên."
                      actionLabel="Tạo đề thi"
                      onAction={() => router.push("/teacher/exams/create")}
                    />
                  ),
                }}
              />
              {data?.pagination && data.pagination.total > 0 ? (
                <div className="mt-4 flex justify-end">
                  <Pagination
                    current={data.pagination.page}
                    pageSize={data.pagination.limit}
                    total={data.pagination.total}
                    onChange={(p, s) => {
                      setPage(p);
                      setLimit(s);
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
        </Card>

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Xóa đề thi?"
          description={
            deleting
              ? `Bạn có chắc muốn xóa đề "${deleting.title}"? Hành động này không thể hoàn tác.`
              : ""
          }
          variant="danger"
          confirmText="Xóa"
          loading={actionLoading}
          onConfirm={handleDelete}
        />
      </AppShellWrapper>
    </AuthGuard>
  );
}
