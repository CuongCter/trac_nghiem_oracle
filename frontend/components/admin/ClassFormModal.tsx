"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { Save, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { classFormSchema, type ClassFormInput } from "@/lib/validators/common.schema";
import type { ClassEntity } from "@/types/exam";
import type { User } from "@/types/user";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import type { ApiError } from "@/types/api";

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: ClassEntity | null;
  onSaved: (c: ClassEntity) => void;
}

export function ClassFormModal({ open, onClose, editing, onSaved }: ClassFormModalProps) {
  const { message } = App.useApp();
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormInput>({
    resolver: zodResolver(classFormSchema),
    defaultValues: { name: "", teacherId: "", students: [] },
  });

  const teacherId = watch("teacherId");
  const selectedStudents = watch("students") ?? [];

  useEffect(() => {
    if (open) {
      void (async () => {
        try {
          const [t, s] = await Promise.all([
            api.get("/users", { params: { role: ROLES.TEACHER, limit: 100 } }) as Promise<{
              items: User[];
            }>,
            api.get("/users", { params: { role: ROLES.STUDENT, limit: 100 } }) as Promise<{
              items: User[];
            }>,
          ]);
          setTeachers(t.items);
          setStudents(s.items);
        } catch {
          message.warning("Không thể tải danh sách giáo viên / học viên");
        }
      })();
      const teacherIdValue =
        editing?.teacherId && typeof editing.teacherId === "object"
          ? editing.teacherId._id
          : (editing?.teacherId as string | undefined);
      const studentIds = (editing?.students ?? []).map((s) =>
        typeof s === "string" ? s : s._id,
      );
      reset({
        name: editing?.name ?? "",
        teacherId: teacherIdValue ?? "",
        students: studentIds,
      });
      setError(null);
    }
  }, [open, editing, reset, message]);

  const onSubmit = async (values: ClassFormInput) => {
    setSaving(true);
    setError(null);
    try {
      const payload: ClassFormInput = {
        name: values.name,
        teacherId: values.teacherId || undefined,
        students: values.students,
      };
      const res = isEdit
        ? await api.put<ClassEntity>(`/classes/${editing!._id}`, payload)
        : await api.post<ClassEntity>("/classes", payload);
      const data = res as unknown as ClassEntity;
      onSaved(data);
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
      title={isEdit ? "Cập nhật lớp học" : "Tạo lớp học"}
      width={560}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Input
          label="Tên lớp"
          placeholder="Lớp CNTT K18A"
          error={errors.name?.message}
          required
          {...register("name")}
        />

        <div>
          <label className="mb-2 ml-4 block text-small font-medium text-heading">
            Giáo viên phụ trách
          </label>
          <Select
            size="large"
            className="w-full"
            placeholder="Chọn giáo viên"
            allowClear
            value={teacherId || undefined}
            onChange={(v) => setValue("teacherId", v ?? "")}
            options={teachers.map((t) => ({
              value: t._id,
              label: `${t.fullName} (${t.email})`,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </div>

        <div>
          <label className="mb-2 ml-4 block text-small font-medium text-heading">
            Học viên ({selectedStudents.length})
          </label>
          <MultiSelect
            size="large"
            className="w-full"
            placeholder="Chọn học viên"
            value={selectedStudents}
            onChange={(v: string[]) => setValue("students", v)}
            options={
              students?.map((s) => ({
                value: s._id,
                label: `${s.fullName} (${s.email})`,
              })) ?? []
            }
            showSearch
            optionFilterProp="label"
            maxTagCount={5}
          />
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
            {isEdit ? "Cập nhật" : "Tạo lớp"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
