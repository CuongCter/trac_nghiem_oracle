"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { App, Progress } from "antd";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { ExamCountdown } from "./ExamCountdown";
import { QuestionCard, QuestionPalette, type ExamQuestionView } from "./QuestionPalette";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { TabSwitchGuardNotice } from "./TabSwitchGuardNotice";
import { useTabSwitch } from "@/hooks/useTabSwitch";
import { useDebouncedEffect } from "@/hooks/useAutoSave";
import { useAntiCheat, requestFullscreen, type AntiCheatViolation } from "@/hooks/useAntiCheat";
import { api } from "@/lib/api";
import type { StartExamResponse } from "@/types/attempt";
import type { ExamResult } from "@/types/result";
import type { OptionLabel } from "@/lib/constants";
import type { ApiError } from "@/types/api";

interface ExamDoingProps {
  examId: string;
  initial?: StartExamResponse;
}

export function ExamDoing({ examId, initial }: ExamDoingProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [data, setData] = useState<StartExamResponse | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, OptionLabel | null>>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleAutoSubmitRef = useRef<() => void>(() => undefined);

  const { count, remaining } = useTabSwitch(() => handleAutoSubmitRef.current?.());

  useAntiCheat({
    enabled: !loading && !!data,
    fullscreenGuard: true,
    onViolation: (type: AntiCheatViolation) => {
      // Best-effort: report violation to BE (fire & forget)
      void api.post(`/student/exams/${examId}/violation`, { type }).catch(() => undefined);
      if (type === "fullscreen-exit") {
        message.warning("Vui lòng quay lại chế độ toàn màn hình");
        void requestFullscreen();
      } else {
        message.warning("Hành động này bị cấm trong lúc thi");
      }
    },
  });

  // Try entering fullscreen on mount (user gesture required, will be best-effort)
  useEffect(() => {
    void requestFullscreen();
    return () => {
      // best-effort exit on unmount
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, []);

  // Initialize from server
  useEffect(() => {
    if (initial) {
      setAnswers(
        Object.fromEntries(
          initial.questions.map((q) => [q._id, null as OptionLabel | null]),
        ),
      );
      setCurrentId(initial.questions[0]?._id ?? null);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        // If we don't have an attempt yet, this is for resume after reload.
        // The route /student/exams/[id]/doing should call /start first.
        const res = (await api.post(`/student/exams/${examId}/start`)) as StartExamResponse;
        setData(res);
        setAnswers(
          Object.fromEntries(res.questions.map((q) => [q._id, null as OptionLabel | null])),
        );
        setCurrentId(res.questions[0]?._id ?? null);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message ?? "Không thể bắt đầu bài thi");
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, initial]);

  // Compute target timestamp for the countdown.
  const target = React.useMemo(() => {
    if (!data) return null;
    const endMs = new Date(data.endTime).getTime();
    return endMs;
  }, [data]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    message.warning("Bạn đã rời tab quá nhiều lần — hệ thống tự động nộp bài");
    setSubmitting(true);
    try {
      const res = (await api.post(`/student/exams/${examId}/submit`)) as ExamResult;
      message.success("Đã nộp bài tự động");
      router.push(`/student/results/${res._id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      message.error(apiErr.message ?? "Nộp bài thất bại");
    } finally {
      setSubmitting(false);
    }
  }, [examId, message, router, submitting]);

  useEffect(() => {
    handleAutoSubmitRef.current = () => {
      void handleAutoSubmit();
    };
  }, [handleAutoSubmit]);

  // Debounced auto-save
  useDebouncedEffect(
    answers,
    async (current) => {
      if (!data) return;
      const entries = Object.entries(current).filter(([, v]) => v != null) as Array<
        [string, OptionLabel]
      >;
      for (const [qid, opt] of entries) {
        try {
          await api.post(`/student/exams/${examId}/save-answer`, {
            questionId: qid,
            selectedOption: opt,
          });
        } catch {
          /* swallow; will retry on next change */
        }
      }
    },
    600,
  );

  const handleSelect = useCallback((qid: string, opt: OptionLabel) => {
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = (await api.post(`/student/exams/${examId}/submit`)) as ExamResult;
      message.success("Đã nộp bài");
      router.push(`/student/results/${res._id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      message.error(apiErr.message ?? "Nộp bài thất bại");
    } finally {
      setSubmitting(false);
      setSubmitOpen(false);
    }
  }, [examId, message, router, submitting]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Đang chuẩn bị bài thi..." />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mt-6">
        <ErrorState description={error ?? "Không thể tải bài thi"} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const questions = data.questions as ExamQuestionView[];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const total = questions.length;
  const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <Card variant="default" padding="md" className="sticky top-2 z-10 mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-tiny uppercase tracking-wider text-body-subtle">Bài thi đang làm</p>
          <h2 className="font-handrawn text-display-5 text-heading">Đang làm bài</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <Progress
              percent={percent}
              format={() => `${answeredCount}/${total} câu`}
            />
          </div>
          <ExamCountdown target={target} onExpire={handleAutoSubmit} />
        </div>
      </Card>

      <TabSwitchGuardNotice count={count} remaining={remaining} />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {questions.map((q, idx) => (
            <QuestionCard
              key={q._id}
              question={q}
              index={idx}
              total={total}
              selected={answers[q._id] ?? null}
              onSelect={(opt) => handleSelect(q._id, opt)}
              questionRef={{
                current: questionRefs.current[q._id] ?? null,
              } as React.RefObject<HTMLDivElement>}
            />
          ))}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Card variant="default" padding="md">
            <h3 className="mb-3 font-handrawn text-display-6 text-heading">Danh sách câu</h3>
            <QuestionPalette
              items={questions.map((q, idx) => ({
                id: q._id,
                index: idx,
                answered: !!answers[q._id],
                current: currentId === q._id,
              }))}
              onJump={(id) => {
                setCurrentId(id);
                const el = document.getElementById(`q-${id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
            <div className="mt-6 border-t-2 border-dashed border-border-default pt-4">
              <Button
                variant="brand"
                size="lg"
                fullWidth
                leftIcon={<Send className="h-4 w-4" />}
                onClick={() => setSubmitOpen(true)}
                loading={submitting}
              >
                Nộp bài
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <SubmitConfirmModal
        open={submitOpen}
        answered={answeredCount}
        total={total}
        loading={submitting}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
