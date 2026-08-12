import { Difficulty, type OptionLabel } from "@/lib/constants";

export interface QuestionOption {
  label: OptionLabel;
  text: string;
}

export interface Question {
  _id: string;
  subjectId: string;
  content: string;
  options: QuestionOption[];
  difficulty: Difficulty;
  chapter: string;
  point: number;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload sent to /api/questions — correctAnswer only required for create/edit */
export interface QuestionInput {
  subjectId: string;
  content: string;
  options: QuestionOption[];
  correctAnswer: OptionLabel;
  difficulty: Difficulty;
  chapter: string;
  point: number;
}

export interface QuestionListQuery {
  page?: number;
  limit?: number;
  subjectId?: string;
  difficulty?: Difficulty;
  chapter?: string;
  search?: string;
}
