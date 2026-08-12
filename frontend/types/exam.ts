import type { ExamStatus } from "@/lib/constants";

export interface SubjectRef {
  _id: string;
  name: string;
  code: string;
}

export interface UserRef {
  _id: string;
  fullName: string;
  email: string;
}

export interface ClassRef {
  _id: string;
  name: string;
}

export interface Exam {
  _id: string;
  title: string;
  subjectId: string | SubjectRef;
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
  createdBy: string | UserRef;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamInput {
  title: string;
  subjectId: string;
  questionIds?: string[];
  randomConfig?: { easy: number; medium: number; hard: number };
  duration: number;
  startTime: string;
  endTime: string;
  assignedClassIds: string[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface ExamListQuery {
  page?: number;
  limit?: number;
  status?: ExamStatus;
  subjectId?: string;
  search?: string;
}

export interface ClassTeacherRef {
  _id: string;
  fullName: string;
  email: string;
}

export type ClassEntity = {
  _id: string;
  name: string;
  teacherId?: ClassTeacherRef | string | null;
  students: ClassTeacherRef[] | string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ClassInput = {
  name: string;
  teacherId?: string;
  students: string[];
};
