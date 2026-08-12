import { z } from "zod";
import { DIFFICULTY, ROLES } from "@/lib/constants";

export const userFormSchema = z.object({
  fullName: z.string().min(2, "Tên tối thiểu 2 ký tự").max(80),
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .optional()
    .or(z.literal("")),
  role: z.enum([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  status: z.enum(["ACTIVE", "LOCKED"]).default("ACTIVE"),
});

export type UserFormInput = z.infer<typeof userFormSchema>;

export const subjectFormSchema = z.object({
  name: z.string().min(2, "Tên môn học tối thiểu 2 ký tự").max(80),
  code: z
    .string()
    .min(2, "Mã môn học tối thiểu 2 ký tự")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Chỉ gồm chữ in hoa, số, dấu gạch"),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type SubjectFormInput = z.infer<typeof subjectFormSchema>;

export const classFormSchema = z.object({
  name: z.string().min(2, "Tên lớp tối thiểu 2 ký tự").max(80),
  teacherId: z.string().optional().or(z.literal("")),
  students: z.array(z.string()).default([]),
});

export type ClassFormInput = z.infer<typeof classFormSchema>;

export const questionFormSchema = z.object({
  subjectId: z.string().min(1, "Chọn môn học"),
  content: z.string().min(2, "Nội dung câu hỏi là bắt buộc"),
  options: z
    .object({
      A: z.string().min(1, "Đáp án A bắt buộc"),
      B: z.string().min(1, "Đáp án B bắt buộc"),
      C: z.string().min(1, "Đáp án C bắt buộc"),
      D: z.string().min(1, "Đáp án D bắt buộc"),
    }),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  difficulty: z.enum([DIFFICULTY.EASY, DIFFICULTY.MEDIUM, DIFFICULTY.HARD]),
  chapter: z.string().max(80).optional().or(z.literal("")),
  point: z.coerce.number().min(0.1, "Điểm phải lớn hơn 0").max(100),
});

export type QuestionFormInput = z.infer<typeof questionFormSchema>;
