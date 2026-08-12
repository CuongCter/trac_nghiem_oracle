"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { InputNumber } from "@/components/ui/Select";
import { Select, MultiSelect } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Table } from "@/components/ui/Table";
import { Checkbox } from "@/components/ui/Checkbox";
import type { Question } from "@/types/question";
import type { Subject } from "@/types/subject";
import type { ClassEntity, ExamInput } from "@/types/exam";
import { DIFFICULTY } from "@/lib/constants";
import type { ApiError } from "@/types/api";
import { api } from "@/lib/api";
import type { PaginatedData } from "@/types/api";
import type { ColumnsType } from "antd/es/table";
import { formatMs } from "@/lib/format";

interface ExamFormValues {
  title: string;
  subjectId: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  assignedClassIds: string[];
  questionIds: string[];
  randomEasy: number;
  randomMedium: number;
  randomHard: number;
}

interface ExamFormProps {
  initial?: Partial<ExamFormValues>;
  subjects: Subject[];
  classes: ClassEntity[];
  onSubmit: (data: ExamInput) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
}

export function ExamForm({
  initial,
  subjects,
  classes,
  onSubmit,
  submitting,
  error,
}: ExamFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamFormValues>({
    defaultValues: {
      title: initial?.title ?? "",
      subjectId: initial?.subjectId ?? "",
      duration: initial?.duration ?? 45,
      startTime: initial?.startTime,
      endTime: initial?.endTime,
      shuffleQuestions: initial?.shuffleQuestions ?? true,
      shuffleOptions: initial?.shuffleOptions ?? true,
      assignedClassIds: initial?.assignedClassIds ?? [],
      questionIds: initial?.questionIds ?? [],
      randomEasy: initial?.randomEasy ?? 0,
      randomMedium: initial?.randomMedium ?? 0,
      randomHard: initial?.randomHard ?? 0,
    },
  });

  const subjectId = watch("subjectId");
  const questionIds = watch("questionIds") ?? [];
  const assignedClassIds = watch("assignedClassIds") ?? [];
  const randomEasy = watch("randomEasy");
  const randomMedium = watch("randomMedium");
  const randomHard = watch("randomHard");

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);
  const [tab, setTab] = React.useState<"manual" | "random">("manual");

  React.useEffect(() => {
    if (!subjectId || tab !== "manual") {
      setQuestions([]);
      return;
    }
    void (async () => {
      setQuestionsLoading(true);
      try {
        const res = (await api.get("/questions", {
          params: { subjectId, limit: 100 },
        })) as PaginatedData<Question>;
        setQuestions(res.items);
      } catch {
        setQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    })();
  }, [subjectId, tab]);

  const submit = async (values: ExamFormValues) => {
    if (!values.startTime || !values.endTime) {
      return;
    }
    if (tab === "manual" && values.questionIds.length === 0) {
      return;
    }
    if (tab === "random") {
      const total =
        (values.randomEasy ?? 0) + (values.randomMedium ?? 0) + (values.randomHard ?? 0);
      if (total === 0) {
        return;
      }
    }
    const payload: ExamInput = {
      title: values.title,
      subjectId: values.subjectId,
      duration: values.duration,
      startTime: values.startTime,
      endTime: values.endTime,
      assignedClassIds: values.assignedClassIds,
      shuffleQuestions: values.shuffleQuestions,
      shuffleOptions: values.shuffleOptions,
      ...(tab === "manual"
        ? { questionIds: values.questionIds }
        : {
            randomConfig: {
              easy: values.randomEasy ?? 0,
              medium: values.randomMedium ?? 0,
              hard: values.randomHard ?? 0,
            },
          }),
    };
    await onSubmit(payload);
  };

  const qColumns: ColumnsType<Question> = [
    {
      title: "Chọn",
      key: "select",
      width: 80,
      render: (_, record) => (
        <Checkbox
          checked={questionIds.includes(record._id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setValue("questionIds", [...questionIds, record._id]);
            } else {
              setValue(
                "questionIds",
                questionIds.filter((id) => id !== record._id),
              );
            }
          }}
        />
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "Độ khó",
      key: "difficulty",
      width: 120,
      render: (_, record) => record.difficulty,
    },
    {
      title: "Chương",
      dataIndex: "chapter",
      key: "chapter",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      width: 80,
      align: "center",
    },
  ];

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card variant="default" padding="md">
        <h3 className="mb-4 font-handrawn text-display-6 text-heading">Thông tin cơ bản</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Tiêu đề đề thi"
            placeholder="VD: Đề thi giữa kỳ môn Lập trình Web"
            error={errors.title?.message}
            required
            {...register("title", { required: "Tiêu đề là bắt buộc" })}
          />
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Môn học <span className="text-danger">*</span>
            </label>
            <Controller
              control={control}
              name="subjectId"
              rules={{ required: "Chọn môn học" }}
              render={({ field }) => (
                <Select
                  {...field}
                  size="large"
                  className="w-full"
                  placeholder="Chọn môn học"
                  showSearch
                  optionFilterProp="label"
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? "")}
                  options={subjects?.map((s) => ({ value: s._id, label: s.name })) ?? []}
                />
              )}
            />
            {errors.subjectId ? (
              <p className="ml-4 mt-1 text-tiny text-fg-danger">{errors.subjectId.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Thời lượng (phút)
            </label>
            <Controller
              control={control}
              name="duration"
              render={({ field }) => (
                <InputNumber
                  {...field}
                  size="large"
                  className="w-full"
                  min={1}
                  max={600}
                  value={field.value}
                  onChange={(v) => field.onChange(Number(v ?? 1))}
                />
              )}
            />
          </div>
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">
              Lớp được gán
            </label>
            <Controller
              control={control}
              name="assignedClassIds"
              render={({ field }) => (
                <MultiSelect
                  size="large"
                  className="w-full"
                  placeholder="Chọn lớp"
                  value={field.value}
                  onChange={(v) => field.onChange(v as string[])}
                  options={classes.map((c) => ({ value: c._id, label: c.name }))}
                />
              )}
            />
          </div>
        </div>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="mb-4 font-handrawn text-display-6 text-heading">Khung giờ thi</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">Bắt đầu</label>
            <Controller
              control={control}
              name="startTime"
              rules={{ required: "Bắt đầu là bắt buộc" }}
              render={({ field }) => {
                const [localValue, setLocalValue] = React.useState("");
                const isInternalUpdate = React.useRef(false);

                React.useEffect(() => {
                  if (isInternalUpdate.current) {
                    isInternalUpdate.current = false;
                    return;
                  }
                  if (field.value) {
                    const d = new Date(field.value);
                    setLocalValue(d.toISOString().slice(0, 16));
                  } else {
                    setLocalValue("");
                  }
                }, [field.value]);

                return (
                  <input
                    type="datetime-local"
                    className="h-11 w-full rounded-pill border-2 border-border-default-medium bg-neutral-primary-soft px-5 text-body text-heading shadow-pencil-xs"
                    value={localValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalValue(val);
                      if (!val) {
                        field.onChange("");
                        return;
                      }
                      isInternalUpdate.current = true;
                      const d = new Date(val);
                      field.onChange(d.toISOString());
                    }}
                  />
                );
              }}
            />
          </div>
          <div>
            <label className="mb-2 ml-4 block text-small font-medium text-heading">Kết thúc</label>
            <Controller
              control={control}
              name="endTime"
              rules={{ required: "Kết thúc là bắt buộc" }}
              render={({ field }) => {
                const [localValue, setLocalValue] = React.useState("");
                const isInternalUpdate = React.useRef(false);

                React.useEffect(() => {
                  if (isInternalUpdate.current) {
                    isInternalUpdate.current = false;
                    return;
                  }
                  if (field.value) {
                    const d = new Date(field.value);
                    setLocalValue(d.toISOString().slice(0, 16));
                  } else {
                    setLocalValue("");
                  }
                }, [field.value]);

                return (
                  <input
                    type="datetime-local"
                    className="h-11 w-full rounded-pill border-2 border-border-default-medium bg-neutral-primary-soft px-5 text-body text-heading shadow-pencil-xs"
                    value={localValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalValue(val);
                      if (!val) {
                        field.onChange("");
                        return;
                      }
                      isInternalUpdate.current = true;
                      const d = new Date(val);
                      field.onChange(d.toISOString());
                    }}
                  />
                );
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Controller
            control={control}
            name="shuffleQuestions"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Xáo trộn thứ tự câu hỏi"
                description="Mỗi học viên sẽ thấy thứ tự câu hỏi khác nhau"
              />
            )}
          />
          <Controller
            control={control}
            name="shuffleOptions"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Xáo trộn thứ tự đáp án"
                description="Mỗi học viên sẽ thấy thứ tự A/B/C/D khác nhau"
              />
            )}
          />
        </div>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="mb-4 font-handrawn text-display-6 text-heading">Bộ câu hỏi</h3>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "manual" | "random")}>
          <TabsList>
            <TabsTrigger value="manual">Chọn thủ công</TabsTrigger>
            <TabsTrigger value="random">Random theo độ khó</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            {!subjectId ? (
              <Alert variant="warning" title="Chưa chọn môn học">
                Vui lòng chọn môn học ở phần thông tin cơ bản trước.
              </Alert>
            ) : (
              <>
                <p className="mb-3 text-small text-body-subtle">
                  Đã chọn {questionIds.length} câu hỏi.
                </p>
                <Table<Question>
                  rowKey="_id"
                  loading={questionsLoading}
                  columns={qColumns}
                  dataSource={questions}
                  pagination={false}
                  rowSelection={{ selectedRowKeys: questionIds, onChange: () => undefined }}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="random">
            <Alert variant="brand" title="Random tự động" className="mb-4">
              Hệ thống sẽ tự động chọn ngẫu nhiên câu hỏi theo số lượng &amp; độ khó.
            </Alert>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 ml-4 block text-small font-medium text-heading">
                  Số câu Dễ
                </label>
                <Controller
                  control={control}
                  name="randomEasy"
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      size="large"
                      className="w-full"
                      min={0}
                      value={field.value}
                      onChange={(v) => field.onChange(Number(v ?? 0))}
                    />
                  )}
                />
              </div>
              <div>
                <label className="mb-2 ml-4 block text-small font-medium text-heading">
                  Số câu Trung bình
                </label>
                <Controller
                  control={control}
                  name="randomMedium"
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      size="large"
                      className="w-full"
                      min={0}
                      value={field.value}
                      onChange={(v) => field.onChange(Number(v ?? 0))}
                    />
                  )}
                />
              </div>
              <div>
                <label className="mb-2 ml-4 block text-small font-medium text-heading">
                  Số câu Khó
                </label>
                <Controller
                  control={control}
                  name="randomHard"
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      size="large"
                      className="w-full"
                      min={0}
                      value={field.value}
                      onChange={(v) => field.onChange(Number(v ?? 0))}
                    />
                  )}
                />
              </div>
            </div>
            <p className="mt-3 text-small text-body-subtle">
              Tổng: {randomEasy + randomMedium + randomHard} câu hỏi (
              {formatMs((randomEasy + randomMedium + randomHard) * 60_000)} tối đa nếu mỗi câu 1
              phút)
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          variant="brand"
          loading={submitting}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Lưu đề thi
        </Button>
      </div>
    </form>
  );
}
