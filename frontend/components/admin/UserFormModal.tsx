"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus } from "lucide-react";
import { App } from "antd";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { userFormSchema, type UserFormInput } from "@/lib/validators/common.schema";
import { ROLES } from "@/lib/constants";
import type { User } from "@/types/user";
import type { ApiError } from "@/types/api";
import { api } from "@/lib/api";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: User | null;
  onSaved: (user: User) => void;
}

export function UserFormModal({ open, onClose, editing, onSaved }: UserFormModalProps) {
  const { message } = App.useApp();
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: editing?.fullName ?? "",
      email: editing?.email ?? "",
      password: "",
      role: (editing?.role as UserFormInput["role"]) ?? ROLES.STUDENT,
      status: (editing?.status as "ACTIVE" | "LOCKED") ?? "ACTIVE",
    },
  });

  const role = watch("role");
  const status = watch("status");

  React.useEffect(() => {
    if (open) {
      reset({
        fullName: editing?.fullName ?? "",
        email: editing?.email ?? "",
        password: "",
        role: (editing?.role as UserFormInput["role"]) ?? ROLES.STUDENT,
        status: (editing?.status as "ACTIVE" | "LOCKED") ?? "ACTIVE",
      });
      setError(null);
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: UserFormInput) => {
    setSaving(true);
    setError(null);
    try {
      const payload: UserFormInput = {
        ...values,
        password: values.password || undefined,
      };
      const res = isEdit
        ? await api.put<{ user: User }>(`/users/${editing!._id}`, payload)
        : await api.post<{ user: User }>("/users", payload);
      const data = res as unknown as { user: User };
      message.success(isEdit ? "Cập nhật người dùng thành công" : "Tạo người dùng thành công");
      onSaved(data.user);
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={isEdit ? "Cập nhật người dùng" : "Tạo người dùng mới"}
      width={520}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          error={errors.fullName?.message}
          required
          {...register("fullName")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="user@example.com"
          error={errors.email?.message}
          required
          disabled={isEdit}
          {...register("email")}
        />
        <Input
          label={isEdit ? "Mật khẩu (để trống nếu không đổi)" : "Mật khẩu"}
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          error={errors.password?.message}
          required={!isEdit}
          {...register("password")}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Vai trò <span className="text-danger">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              value={role}
              onChange={(v) =>
                setValue("role", v as UserFormInput["role"], { shouldValidate: true })
              }
              options={[
                { value: ROLES.ADMIN, label: "Quản trị viên" },
                { value: ROLES.TEACHER, label: "Giáo viên" },
                { value: ROLES.STUDENT, label: "Học viên" },
              ]}
            />
          </div>
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Trạng thái
            </label>
            <Select
              size="large"
              className="w-full"
              value={status}
              onChange={(v) =>
                setValue("status", v as "ACTIVE" | "LOCKED", { shouldValidate: true })
              }
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "LOCKED", label: "Đã khóa" },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Hủy
          </Button>
          <Button
            type="submit"
            variant="brand"
            leftIcon={isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            loading={saving}
          >
            {isEdit ? "Cập nhật" : "Tạo người dùng"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
