"use client";

import * as React from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Upload, Download } from "lucide-react";
import { App, Upload as AntdUpload } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { QuestionFormModal } from "@/components/exam/QuestionFormModal";
import { api } from "@/lib/api";
import { ROLES, DIFFICULTY, type Difficulty } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { exportToExcel, parseExcelFile } from "@/lib/excel";
import type { Question } from "@/types/question";
import type { Subject } from "@/types/subject";
import type { PaginatedData } from "@/types/api";
import type { ColumnsType } from "antd/es/table";

const difficultyVariant: Record<Difficulty, "success" | "warning" | "danger"> = {
  [DIFFICULTY.EASY]: "success",
  [DIFFICULTY.MEDIUM]: "warning",
  [DIFFICULTY.HARD]: "danger",
};

const difficultyLabel: Record<Difficulty, string> = {
  [DIFFICULTY.EASY]: "Dễ",
  [DIFFICULTY.MEDIUM]: "Trung bình",
  [DIFFICULTY.HARD]: "Khó",
};

export default function TeacherQuestionsPage() {
  const { message } = App.useApp();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [subjectFilter, setSubjectFilter] = React.useState<string | undefined>();
  const [difficultyFilter, setDifficultyFilter] = React.useState<Difficulty | undefined>();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [data, setData] = React.useState<PaginatedData<Question> | null>(null);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Question | null>(null);
  const [deleting, setDeleting] = React.useState<Question | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (subjectFilter) params.subjectId = subjectFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      const res = (await api.get("/questions", { params })) as PaginatedData<Question>;
      setData(res);
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Không thể tải danh sách câu hỏi");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, subjectFilter, difficultyFilter]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, subjectFilter, difficultyFilter]);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = (await api.get("/subjects", { params: { limit: 100 } })) as Subject[];
        setSubjects(res ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setActionLoading(true);
    try {
      await api.delete(`/questions/${deleting._id}`);
      message.success("Đã xóa câu hỏi");
      setDeleting(null);
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const subjectName = (subjectId: unknown) => {
    if (!subjectId) return "—";
    const id = typeof subjectId === "object" ? (subjectId as { _id: string })._id : String(subjectId);
    return subjects.find((s) => s._id === id)?.name ?? "—";
  };

  const columns: ColumnsType<Question> = [
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text: string) => <span className="text-body">{text}</span>,
    },
    {
      title: "Môn học",
      key: "subjectId",
      width: 160,
      render: (_, record) => subjectName(record.subjectId),
    },
    {
      title: "Độ khó",
      key: "difficulty",
      width: 140,
      render: (_, record) => (
        <Badge variant={difficultyVariant[record.difficulty]}>
          {difficultyLabel[record.difficulty]}
        </Badge>
      ),
    },
    {
      title: "Chương",
      dataIndex: "chapter",
      key: "chapter",
      width: 160,
      ellipsis: true,
      render: (c?: string) => c || <span className="text-body-subtle">—</span>,
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      width: 80,
      align: "center",
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
              onSelect={() => {
                setEditing(record);
                setModalOpen(true);
              }}
            >
              Chỉnh sửa
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              leftIcon={<Trash2 className="h-4 w-4" />}
              onSelect={() => setDeleting(record)}
              className="text-fg-danger"
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
          eyebrow="Ngân hàng"
          title="Câu hỏi"
          description="Quản lý ngân hàng câu hỏi trắc nghiệm."
          actions={
            <div className="flex flex-wrap gap-2">
              <AntdUpload
                accept=".xlsx,.xls"
                showUploadList={false}
                beforeUpload={async (file) => {
                  try {
                    const rows = await parseExcelFile<Record<string, unknown>>(file);
                    await api.post("/teacher/questions/import", { rows });
                    message.success(`Đã import ${rows.length} câu hỏi`);
                    void fetchData();
                  } catch (e: unknown) {
                    const err = e as { message?: string };
                    message.error(err?.message ?? "Import thất bại");
                  }
                  return false;
                }}
              >
                <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />}>
                  Import Excel
                </Button>
              </AntdUpload>
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => {
                  if (data?.items?.length) {
                    exportToExcel(
                      data.items.map((q) => ({
                        content: q.content,
                        optionA: q.options?.[0]?.text ?? "",
                        optionB: q.options?.[1]?.text ?? "",
                        optionC: q.options?.[2]?.text ?? "",
                        optionD: q.options?.[3]?.text ?? "",
                        correct: q.correctOption,
                        difficulty: q.difficulty,
                        chapter: q.chapter ?? "",
                        point: q.point ?? 1,
                      })),
                      [
                        { key: "content", header: "Nội dung" },
                        { key: "optionA", header: "A" },
                        { key: "optionB", header: "B" },
                        { key: "optionC", header: "C" },
                        { key: "optionD", header: "D" },
                        { key: "correct", header: "Đáp án đúng" },
                        { key: "difficulty", header: "Độ khó" },
                        { key: "chapter", header: "Chương" },
                        { key: "point", header: "Điểm" },
                      ],
                      "questions.xlsx",
                    );
                  }
                }}
                disabled={!data?.items?.length}
              >
                Export Excel
              </Button>
              <Button
                variant="brand"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                Tạo câu hỏi
              </Button>
            </div>
          }
        />

        <Card variant="default" padding="md" className="mt-6">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              placeholder="Tìm theo nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
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
            <Select
              size="large"
              placeholder="Tất cả độ khó"
              allowClear
              value={difficultyFilter}
              onChange={(v) => setDifficultyFilter((v || undefined) as Difficulty | undefined)}
              options={[
                { value: DIFFICULTY.EASY, label: "Dễ" },
                { value: DIFFICULTY.MEDIUM, label: "Trung bình" },
                { value: DIFFICULTY.HARD, label: "Khó" },
              ]}
            />
          </div>

          {error ? (
            <ErrorState description={error} onRetry={fetchData} className="my-4" />
          ) : (
            <>
              <Table<Question>
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={data?.items ?? []}
                pagination={false}
                locale={{
                  emptyText: (
                    <EmptyState
                      title="Chưa có câu hỏi nào"
                      description="Hãy tạo câu hỏi đầu tiên."
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

        <QuestionFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editing}
          subjects={subjects}
          onSaved={() => {
            message.success(editing ? "Cập nhật thành công" : "Tạo câu hỏi thành công");
            fetchData();
          }}
        />

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Xóa câu hỏi?"
          description={
            deleting
              ? "Bạn có chắc muốn xóa câu hỏi này? Nếu câu hỏi đang thuộc đề đã xuất bản, hệ thống sẽ từ chối."
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
