"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { InputNumber } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { questionFormSchema, type QuestionFormInput } from "@/lib/validators/common.schema";
import { DIFFICULTY, OPTION_LABELS, type OptionLabel } from "@/lib/constants";
import type { Question } from "@/types/question";
import type { Subject } from "@/types/subject";
import { api } from "@/lib/api";
import type { ApiError } from "@/types/api";

interface QuestionFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Question | null;
  subjects: Subject[];
  onSaved: (q: Question) => void;
}

export function QuestionFormModal({
  open,
  onClose,
  editing,
  subjects,
  onSaved,
}: QuestionFormModalProps) {
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
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      subjectId: editing?.subjectId ?? "",
      content: editing?.content ?? "",
      options: { A: "", B: "", C: "", D: "" },
      correctAnswer: "A" as OptionLabel,
      difficulty: editing?.difficulty ?? DIFFICULTY.MEDIUM,
      chapter: editing?.chapter ?? "",
      point: editing?.point ?? 1,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        subjectId: editing?.subjectId ?? "",
        content: editing?.content ?? "",
        options: {
          A: editing?.options?.find((o) => o.label === "A")?.text ?? "",
          B: editing?.options?.find((o) => o.label === "B")?.text ?? "",
          C: editing?.options?.find((o) => o.label === "C")?.text ?? "",
          D: editing?.options?.find((o) => o.label === "D")?.text ?? "",
        },
        correctAnswer: "A",
        difficulty: editing?.difficulty ?? DIFFICULTY.MEDIUM,
        chapter: editing?.chapter ?? "",
        point: editing?.point ?? 1,
      });
      setError(null);
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: QuestionFormInput) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        subjectId: values.subjectId,
        content: values.content,
        options: OPTION_LABELS.map((label) => ({
          label,
          text: values.options[label],
        })),
        correctAnswer: values.correctAnswer,
        difficulty: values.difficulty,
        chapter: values.chapter,
        point: values.point,
      };
      const res = isEdit
        ? await api.put<{ question: Question }>(`/questions/${editing!._id}`, payload)
        : await api.post<{ question: Question }>("/questions", payload);
      const data = res as unknown as { question: Question };
      onSaved(data.question);
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
      title={isEdit ? "Cập nhật câu hỏi" : "Tạo câu hỏi mới"}
      width={680}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Môn học <span className="text-danger">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              placeholder="Chọn môn học"
              showSearch
              optionFilterProp="label"
              value={watch("subjectId") || undefined}
              onChange={(v) => setValue("subjectId", v ?? "")}
              options={subjects?.map((s) => ({ value: s._id, label: s.name })) ?? []}
            />
            {errors.subjectId ? (
              <p className="mt-1 ml-4 text-tiny text-fg-danger">
                {errors.subjectId.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Điểm
            </label>
            <InputNumber
              size="large"
              className="w-full"
              min={0.1}
              step={0.1}
              value={watch("point")}
              onChange={(v) => setValue("point", Number(v ?? 1))}
            />
          </div>
        </div>

        <Textarea
          label="Nội dung câu hỏi"
          rows={3}
          placeholder="Nhập nội dung câu hỏi..."
          error={errors.content?.message}
          required
          {...register("content")}
        />

        <div className="space-y-3">
          <p className="ml-4 text-small font-medium text-heading">
            Các đáp án <span className="text-danger">*</span>
          </p>
          {OPTION_LABELS.map((label) => (
            <Input
              key={label}
              label={`Đáp án ${label}`}
              placeholder={`Nội dung đáp án ${label}...`}
              error={errors.options?.[label]?.message}
              {...register(`options.${label}`)}
            />
          ))}
        </div>

        <div>
          <p className="mb-2 ml-4 block text-small font-medium text-heading">
            Đáp án đúng
          </p>
          <RadioGroup
            orientation="horizontal"
            options={OPTION_LABELS.map((l) => ({ value: l, label: l }))}
            value={watch("correctAnswer")}
            onValueChange={(v) => setValue("correctAnswer", v as OptionLabel)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 ml-4 block text-small font-medium text-heading">Độ khó</p>
            <RadioGroup
              options={[
                { value: DIFFICULTY.EASY, label: "Dễ" },
                { value: DIFFICULTY.MEDIUM, label: "Trung bình" },
                { value: DIFFICULTY.HARD, label: "Khó" },
              ]}
              value={watch("difficulty")}
              onValueChange={(v) => setValue("difficulty", v as QuestionFormInput["difficulty"])}
            />
          </div>
          <Input
            label="Chương / chủ đề"
            placeholder="VD: Chương 1 - Giới thiệu"
            error={errors.chapter?.message}
            {...register("chapter")}
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
            {isEdit ? "Cập nhật" : "Tạo câu hỏi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
