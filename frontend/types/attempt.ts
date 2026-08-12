import type { AttemptStatus, OptionLabel } from "@/lib/constants";

export interface AttemptAnswer {
  questionId: string;
  selectedOption: OptionLabel | null;
}

export interface ExamAttempt {
  _id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  answers: AttemptAnswer[];
  status: AttemptStatus;
  isAutoSubmitted: boolean;
}

export interface StartExamResponse {
  attemptId: string;
  duration: number;
  endTime: string;
  questions: Array<{
    _id: string;
    content: string;
    options: Array<{ label: OptionLabel; text: string }>;
    point: number;
  }>;
}
