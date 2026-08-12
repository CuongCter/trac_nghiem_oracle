"use client";

import * as React from "react";
import { App } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { subjectFormSchema, type SubjectFormInput } from "@/lib/validators/common.schema";
import type { Subject } from "@/types/subject";
import { api } from "@/lib/api";
import type { ApiError } from "@/types/api";

interface SubjectFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Subject | null;
  onSaved: (s: Subject) => void;
}

export function SubjectFormModal({ open, onClose, editing, onSaved }: SubjectFormModalProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormInput>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: editing?.name ?? "",
      code: editing?.code ?? "",
      description: editing?.description ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        code: editing?.code ?? "",
        description: editing?.description ?? "",
      });
      setError(null);
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: SubjectFormInput) => {
    setSaving(true);
    setError(null);
    try {
      const res = isEdit
        ? await api.put<{ subject: Subject }>(`/subjects/${editing!._id}`, values)
        : await api.post<{ subject: Subject }>("/subjects", values);
      const data = res as unknown as { subject: Subject };
      onSaved(data.subject);
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
      title={isEdit ? "Cập nhật môn học" : "Tạo môn học"}
      width={520}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Input
          label="Tên môn học"
          placeholder="Lập trình Web"
          error={errors.name?.message}
          required
          {...register("name")}
        />
        <Input
          label="Mã môn học"
          placeholder="WEB101"
          hint="Chỉ gồm chữ IN HOA, số và dấu gạch"
          error={errors.code?.message}
          required
          {...register("code", {
            setValueAs: (v) => (typeof v === "string" ? v.toUpperCase() : v),
          })}
        />
        <Textarea
          label="Mô tả"
          placeholder="Mô tả ngắn về môn học..."
          rows={3}
          error={errors.description?.message}
          {...register("description")}
        />
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
            {isEdit ? "Cập nhật" : "Tạo môn học"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
