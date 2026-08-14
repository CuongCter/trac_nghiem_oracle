"use client";

import * as React from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { SubjectFormModal } from "@/components/admin/SubjectFormModal";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import type { Subject } from "@/types/subject";
import type { PaginatedData } from "@/types/api";
import type { ColumnsType } from "antd/es/table";

export default function AdminSubjectsPage() {
  const { message } = App.useApp();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [data, setData] = React.useState<PaginatedData<Subject> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Subject | null>(null);
  const [deleting, setDeleting] = React.useState<Subject | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.get("/subjects", {
        params: { page, limit, search: debouncedSearch || undefined },
      })) as PaginatedData<Subject>;
      setData(res);
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Không thể tải danh sách môn học");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleting) return;
    setActionLoading(true);
    try {
      await api.delete(`/subjects/${deleting._id}`);
      message.success("Đã xóa môn học");
      setDeleting(null);
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnsType<Subject> = [
    { title: "Mã", dataIndex: "code", key: "code", width: 140 },
    { title: "Tên môn học", dataIndex: "name", key: "name" },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (d?: string) => d || <span className="text-body-subtle">—</span>,
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
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <AppShellWrapper role={ROLES.ADMIN}>
        <PageHeader
          eyebrow="Danh mục"
          title="Môn học"
          description="Quản lý danh sách môn học trong hệ thống."
          actions={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Tạo môn học
            </Button>
          }
        />

        <Card variant="default" padding="md" className="mt-6">
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Tìm theo tên hoặc mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {error ? (
            <ErrorState description={error} onRetry={fetchData} className="my-4" />
          ) : (
            <>
              <Table<Subject>
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={data?.items ?? []}
                pagination={false}
                locale={{
                  emptyText: (
                    <EmptyState
                      title="Chưa có môn học"
                      description="Tạo môn học đầu tiên để bắt đầu."
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

        <SubjectFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editing}
          onSaved={() => {
            message.success(editing ? "Cập nhật thành công" : "Tạo mới thành công");
            fetchData();
          }}
        />

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Xóa môn học?"
          description={
            deleting
              ? `Bạn có chắc muốn xóa môn "${deleting.name}"? Hành động này không thể hoàn tác.`
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
