"use client";

import * as React from "react";
import { App } from "antd";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Clock, Users, BookOpen, CheckCircle2 } from "lucide-react";
import { formatDateTime, formatDuration } from "@/lib/format";
import { EXAM_STATUS, type OptionLabel } from "@/lib/constants";
import { useRouter } from "next/navigation";
import type { Exam } from "@/types/exam";
import type { Subject } from "@/types/subject";
import { cn } from "@/lib/cn";

export interface StudentExamCardData extends Exam {
  subjectName?: string;
  hasAttempt?: boolean;
  attemptId?: string;
}

interface ExamCardProps {
  exam: StudentExamCardData;
  subject?: Subject;
  onStart?: (exam: StudentExamCardData) => void;
}

export function ExamCard({ exam, subject, onStart }: ExamCardProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const now = new Date();
  const start = exam.startTime ? new Date(exam.startTime) : null;
  const end = exam.endTime ? new Date(exam.endTime) : null;
  const isUpcoming = start ? now < start : false;
  const isClosed = end ? now > end : true || exam.status === EXAM_STATUS.CLOSED;
  const isLive = !isUpcoming && !isClosed;
  const disabled = isUpcoming || isClosed || exam.status !== EXAM_STATUS.PUBLISHED;

  const handleClick = () => {
    if (disabled) {
      if (isUpcoming) message.info("Đề thi chưa mở");
      else if (isClosed) message.info("Đề thi đã đóng");
      return;
    }
    if (onStart) {
      onStart(exam);
    } else {
      router.push(`/student/exams/${exam._id}/start`);
    }
  };

  return (
    <Card
      variant="interactive"
      padding="md"
      onClick={handleClick}
      className={cn(disabled && "cursor-not-allowed opacity-70 hover:translate-x-0 hover:translate-y-0")}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-handrawn text-display-6 text-heading">{exam.title}</h3>
          {isLive && exam.status === EXAM_STATUS.PUBLISHED ? (
            <Badge variant="success" leftIcon={<CheckCircle2 className="h-3 w-3" />}>
              Đang mở
            </Badge>
          ) : isUpcoming ? (
            <Badge variant="warning">Sắp mở</Badge>
          ) : (
            <Badge variant="gray">Đã đóng</Badge>
          )}
        </div>

        {subject ? (
          <p className="inline-flex items-center gap-2 text-small text-body-subtle">
            <BookOpen className="h-4 w-4" /> {subject.name}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-small text-body-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {formatDuration(exam.duration)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {exam.totalQuestions ?? exam.questionIds?.length ?? 0} câu
          </span>
          <span className="col-span-2 text-tiny">
            {formatDateTime(exam.startTime)} → {formatDateTime(exam.endTime)}
          </span>
        </div>

        <div className="mt-2 flex justify-end">
          <Button
            variant={disabled ? "secondary" : "brand"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={disabled}
          >
            {exam.hasAttempt ? "Xem kết quả" : isUpcoming ? "Chưa mở" : isClosed ? "Đã đóng" : "Vào thi"}
          </Button>
        </div>
        <CardContent className="hidden" />
      </div>
    </Card>
  );
}

export type { OptionLabel };
