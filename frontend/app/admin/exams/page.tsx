"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ExamStatusBadge } from "@/components/exam/ExamStatusBadge";
import { api } from "@/lib/api";
import { ROLES, EXAM_STATUS, type ExamStatus } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/format";
import type { Exam } from "@/types/exam";
import type { Subject } from "@/types/subject";
import type { PaginatedData } from "@/types/api";
import type { ColumnsType } from "antd/es/table";

const statusFilterOptions: { value: ExamStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: EXAM_STATUS.DRAFT, label: "Bản nháp" },
  { value: EXAM_STATUS.PUBLISHED, label: "Đã xuất bản" },
  { value: EXAM_STATUS.CLOSED, label: "Đã đóng" },
];

export default function AdminExamsPage() {
  const { message } = App.useApp();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = React.useState<ExamStatus | undefined>();
  const [subjectFilter, setSubjectFilter] = React.useState<string | undefined>();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [data, setData] = React.useState<PaginatedData<Exam> | null>(null);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (subjectFilter) params.subjectId = subjectFilter;
      const res = (await api.get("/exams", { params })) as PaginatedData<Exam>;
      setData(res);
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Không thể tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, subjectFilter]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, subjectFilter]);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = (await api.get("/subjects", {
          params: { limit: 100 },
        })) as PaginatedData<Subject>;
        setSubjects(res?.items ?? []);
      } catch {
        // subjects are optional
      }
    })();
  }, []);

  const getSubject = (id: string) => subjects.find((s) => s._id === id);

  const columns: ColumnsType<Exam> = [
    { title: "Tiêu đề", dataIndex: "title", key: "title", ellipsis: true },
    {
      title: "Môn học",
      key: "subjectId",
      width: 200,
      render: (_, record) => {
        const subject =
          typeof record.subjectId === "object" ? record.subjectId : getSubject(record.subjectId);
        return subject ? (
          <div>
            <div className="font-medium">{subject.name}</div>
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      title: "Số câu",
      key: "totalQuestions",
      width: 100,
      align: "center",
      render: (_, record) => record.totalQuestions ?? record.questionIds?.length ?? 0,
    },
    {
      title: "Thời lượng",
      key: "duration",
      width: 120,
      align: "center",
      render: (_, record) => `${record.duration} phút`,
    },
    {
      title: "Bắt đầu",
      key: "startTime",
      width: 160,
      render: (_, record) => formatDateTime(record.startTime),
    },
    {
      title: "Kết thúc",
      key: "endTime",
      width: 160,
      render: (_, record) => formatDateTime(record.endTime),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 160,
      render: (_, record) => <ExamStatusBadge status={record.status} />,
    },
  ];

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <AppShellWrapper role={ROLES.ADMIN}>
        <PageHeader
          eyebrow="Giám sát"
          title="Tất cả đề thi"
          description="Danh sách đề thi trong toàn hệ thống (chỉ xem)."
        />

        <Card variant="default" padding="md" className="mt-6">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              placeholder="Tìm theo tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select
              size="large"
              placeholder="Tất cả trạng thái"
              allowClear
              value={statusFilter}
              onChange={(v) => setStatusFilter((v || undefined) as ExamStatus | undefined)}
              options={statusFilterOptions}
            />
            <Select
              size="large"
              placeholder="Tất cả môn học"
              allowClear
              showSearch
              optionFilterProp="label"
              value={subjectFilter}
              onChange={(v) => setSubjectFilter(v || undefined)}
              options={subjects?.map((s) => ({ value: s._id, label: s.name })) ?? []}
            />
          </div>

          {error ? (
            <ErrorState description={error} onRetry={fetchData} className="my-4" />
          ) : (
            <>
              <Table<Exam>
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={data?.items ?? []}
                pagination={false}
                locale={{
                  emptyText: (
                    <EmptyState
                      title="Chưa có đề thi nào"
                      description="Đề thi sẽ hiển thị khi giáo viên tạo và xuất bản."
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
      </AppShellWrapper>
    </AuthGuard>
  );
}
