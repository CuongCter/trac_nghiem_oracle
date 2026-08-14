"use client";

import * as React from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users as UsersIcon } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { ClassFormModal } from "@/components/admin/ClassFormModal";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import type { ClassEntity } from "@/types/exam";
import type { ColumnsType } from "antd/es/table";

export default function AdminClassesPage() {
  const { message } = App.useApp();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [data, setData] = React.useState<ClassEntity[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClassEntity | null>(null);
  const [deleting, setDeleting] = React.useState<ClassEntity | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.get("/classes", {
        params: { search: debouncedSearch || undefined },
      })) as ClassEntity[];
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Không thể tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleting) return;
    setActionLoading(true);
    try {
      await api.delete(`/classes/${deleting._id}`);
      message.success("Đã xóa lớp");
      setDeleting(null);
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnsType<ClassEntity> = [
    { title: "Tên lớp", dataIndex: "name", key: "name" },
    {
      title: "Sĩ số",
      key: "studentsCount",
      width: 120,
      render: (_, record) => (
        <Badge variant="gray" leftIcon={<UsersIcon className="h-3 w-3" />}>
          {record.students?.length ?? 0} học viên
        </Badge>
      ),
    },
    {
      title: "Giáo viên",
      key: "teacherId",
      width: 200,
      render: (_, record) => {
        const teacher = record.teacherId;
        if (teacher && typeof teacher === "object") {
          return (
            <div className="flex flex-col">
              <span className="text-small font-medium text-heading">{teacher.fullName}</span>
              <span className="text-tiny text-body-subtle">{teacher.email}</span>
            </div>
          );
        }
        return <span className="text-body-subtle">—</span>;
      },
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
          eyebrow="Tổ chức"
          title="Lớp học"
          description="Quản lý lớp học, giáo viên phụ trách và danh sách học viên."
          actions={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Tạo lớp học
            </Button>
          }
        />

        <Card variant="default" padding="md" className="mt-6">
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Tìm theo tên lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {error ? (
            <ErrorState description={error} onRetry={fetchData} className="my-4" />
          ) : (
            <Table<ClassEntity>
              rowKey="_id"
              loading={loading}
              columns={columns}
              dataSource={data?.items ?? []}
              pagination={false}
              locale={{
                emptyText: (
                  <EmptyState
                    title="Chưa có lớp học"
                    description="Tạo lớp học đầu tiên để bắt đầu."
                  />
                ),
              }}
            />
          )}
        </Card>

        <ClassFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editing}
          onSaved={() => {
            message.success(editing ? "Cập nhật thành công" : "Tạo lớp thành công");
            fetchData();
          }}
        />

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Xóa lớp học?"
          description={
            deleting
              ? `Bạn có chắc muốn xóa lớp "${deleting.name}"? Hành động này không thể hoàn tác.`
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
