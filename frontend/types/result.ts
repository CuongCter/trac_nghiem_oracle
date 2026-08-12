import type { OptionLabel } from "@/lib/constants";

export interface ResultAnswer {
  questionId: string;
  selectedOption: OptionLabel | null;
  isCorrect: boolean;
}

export interface ExamResult {
  _id: string;
  examId: string;
  studentId: string;
  examTitle?: string;
  studentName?: string;
  answers: ResultAnswer[];
  totalCorrect: number;
  totalWrong: number;
  score: number;
  passed: boolean;
  submittedAt: string;
  gradedAt?: string;
}
