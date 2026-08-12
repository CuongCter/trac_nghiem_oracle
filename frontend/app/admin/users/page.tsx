"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Lock, Unlock, Trash2 } from "lucide-react";
import { App } from "antd";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
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
import { UserFormModal } from "@/components/admin/UserFormModal";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/format";
import type { User } from "@/types/user";
import type { PaginatedData } from "@/types/api";
import type { ColumnsType } from "antd/es/table";

const roleLabel: Record<string, string> = {
  ADMIN: "Quản trị viên",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
};

const roleVariant: Record<string, "brand" | "warning" | "gray"> = {
  ADMIN: "brand",
  TEACHER: "warning",
  STUDENT: "gray",
};

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [role, setRole] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [lockTarget, setLockTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (role) params.role = role;
      if (status) params.status = status;
      const res = (await api.get("/users", { params })) as PaginatedData<User>;
      setData(res);
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, role, status]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const handleEdit = (user: User) => {
    setEditing(user);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleToggleLock = async () => {
    if (!lockTarget) return;
    setActionLoading(true);
    try {
      const newStatus = lockTarget.status === "LOCKED" ? "ACTIVE" : "LOCKED";
      await api.put(`/users/${lockTarget._id}`, { status: newStatus });
      message.success(
        newStatus === "LOCKED" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      );
      setLockTarget(null);
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      message.success("Đã xóa người dùng");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      const apiErr = err as { message?: string };
      message.error(apiErr.message ?? "Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaved = (_user: User) => {
    message.success(editing ? "Cập nhật thành công" : "Tạo người dùng thành công");
    fetchData();
  };

  const columns: ColumnsType<User> = [
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record) => (
        <div>
          <div className="font-medium text-heading">{text}</div>
          <div className="text-tiny text-body-subtle">{record.email}</div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 160,
      render: (r: string) => (
        <Badge variant={roleVariant[r] ?? "gray"} size="lg">
          {roleLabel[r] ?? r}
        </Badge>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (s?: string) =>
        s === "LOCKED" ? (
          <Badge variant="danger" size="lg">
            Đã khóa
          </Badge>
        ) : (
          <Badge variant="success" size="lg">
            Hoạt động
          </Badge>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (d?: string) => formatDate(d),
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
            <DropdownItem leftIcon={<Edit className="h-4 w-4" />} onSelect={() => handleEdit(record)}>
              Chỉnh sửa
            </DropdownItem>
            <DropdownItem
              leftIcon={
                record.status === "LOCKED" ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )
              }
              onSelect={() => setLockTarget(record)}
              className={
                record.status === "LOCKED" ? "text-fg-success" : "text-fg-danger"
              }
            >
              {record.status === "LOCKED" ? "Mở khóa" : "Khóa tài khoản"}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              leftIcon={<Trash2 className="h-4 w-4" />}
              onSelect={() => setDeleteTarget(record)}
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
          eyebrow="Quản lý"
          title="Người dùng"
          description="Tạo, chỉnh sửa, khóa/mở khóa tài khoản hệ thống."
          actions={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleNew}
            >
              Tạo người dùng
            </Button>
          }
        />

        <Card variant="default" padding="md" className="mt-6">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select
              placeholder="Tất cả vai trò"
              allowClear
              size="large"
              value={role}
              onChange={(v) => setRole(v)}
              options={[
                { value: ROLES.ADMIN, label: "Quản trị viên" },
                { value: ROLES.TEACHER, label: "Giáo viên" },
                { value: ROLES.STUDENT, label: "Học viên" },
              ]}
            />
            <Select
              placeholder="Tất cả trạng thái"
              allowClear
              size="large"
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "LOCKED", label: "Đã khóa" },
              ]}
            />
          </div>

          {error ? (
            <ErrorState
              description={error}
              onRetry={fetchData}
              className="my-4"
            />
          ) : (
            <>
              <Table<User>
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={data?.items ?? []}
                pagination={false}
                locale={{
                  emptyText: (
                    <EmptyState
                      title="Chưa có người dùng nào"
                      description="Hãy tạo người dùng đầu tiên để bắt đầu."
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

        <UserFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editing}
          onSaved={handleSaved}
        />

        <ConfirmDialog
          open={!!lockTarget}
          onOpenChange={(o) => !o && setLockTarget(null)}
          title={
            lockTarget?.status === "LOCKED" ? "Mở khóa tài khoản?" : "Khóa tài khoản?"
          }
          description={
            lockTarget
              ? `Bạn có chắc muốn ${
                  lockTarget.status === "LOCKED" ? "mở khóa" : "khóa"
                } tài khoản của ${lockTarget.fullName}?`
              : ""
          }
          variant={lockTarget?.status === "LOCKED" ? "brand" : "danger"}
          confirmText={lockTarget?.status === "LOCKED" ? "Mở khóa" : "Khóa"}
          loading={actionLoading}
          onConfirm={handleToggleLock}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Xóa người dùng?"
          description={
            deleteTarget
              ? `Bạn có chắc muốn xóa vĩnh viễn tài khoản của ${deleteTarget.fullName}? Hành động này không thể hoàn tác. Nếu người dùng còn dữ liệu liên quan (lớp, đề thi, lượt thi...), hãy dùng chức năng "Khóa tài khoản" thay thế.`
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
