import type { Role, UserStatus, Difficulty, ExamStatus, AttemptStatus, OptionLabel } from "../constants";

export type { Role, UserStatus, Difficulty, ExamStatus, AttemptStatus, OptionLabel } from "../constants";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string | null;
  createdBy?: string | UserRef | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRef {
  _id: string;
  fullName: string;
  email: string;
}

export interface QuestionOption {
  label: OptionLabel;
  text: string;
}

export interface Question {
  _id: string;
  subjectId: string | Subject;
  content: string;
  options: QuestionOption[];
  difficulty: Difficulty;
  chapter?: string | null;
  point: number;
  createdBy?: string | UserRef | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassRef {
  _id: string;
  name: string;
}

export interface Exam {
  _id: string;
  title: string;
  subjectId: string | Subject;
  questionIds: string[];
  duration: number;
  totalQuestions: number;
  totalPoints: number;
  startTime: string;
  endTime: string;
  assignedClassIds: (string | ClassRef)[];
  status: ExamStatus;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdBy?: string | UserRef | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassEntity {
  _id: string;
  name: string;
  teacherId?: string | UserRef | null;
  students: (string | UserRef)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOption: OptionLabel | null;
}

export interface ExamAttempt {
  _id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string | null;
  endTime: string;
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

export interface ViolationEvent {
  attemptId: string;
  examId: string;
  studentId: string;
  studentName?: string;
  type: string;
  ts: number;
}
