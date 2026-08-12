import { z } from "zod";
import { objectIdString, userStatusSchema, difficultySchema, roleSchema } from "./common";

export const userIdParam = z.object({ id: objectIdString });

export const userListQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  search: z.string().trim().optional(),
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
});

export const userCreateSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(128).optional(),
    role: roleSchema,
    status: userStatusSchema.optional(),
  })
  .transform((d) => ({ ...d, password: d.password ?? "" }));

export const userUpdateSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(128).optional(),
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
});

export const subjectListQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  search: z.string().trim().optional(),
});

export const subjectCreateSchema = z.object({
  name: z.string().min(2).max(80),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "code chỉ gồm chữ in hoa, số, _ và -"),
  description: z.string().max(500).optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();

export const classCreateSchema = z.object({
  name: z.string().min(2).max(80),
  teacherId: z.string().regex(/^\d+$/).optional().nullable(),
  students: z.array(z.string().regex(/^\d+$/)).default([]),
});

export const classUpdateSchema = classCreateSchema.partial();

export const questionOptionSchema = z.object({
  label: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
});

export const questionCreateSchema = z
  .object({
    subjectId: objectIdString,
    content: z.string().min(2),
    options: z.tuple([
      questionOptionSchema,
      questionOptionSchema,
      questionOptionSchema,
      questionOptionSchema,
    ]),
    correctAnswer: z.enum(["A", "B", "C", "D"]),
    difficulty: difficultySchema,
    chapter: z.string().max(80).optional().nullable(),
    point: z.coerce.number().min(0.1).max(100),
  })
  .refine((d) => {
    const labels = d.options.map((o) => o.label);
    return labels.includes("A") && labels.includes("B") && labels.includes("C") && labels.includes("D");
  }, { message: "Phải có đủ 4 lựa chọn A, B, C, D", path: ["options"] })
  .refine((d) => d.options.some((o) => o.label === d.correctAnswer), {
    message: "Đáp án đúng phải thuộc một trong các lựa chọn",
    path: ["correctAnswer"],
  });

export const questionUpdateSchema = z.object({
  subjectId: objectIdString.optional(),
  content: z.string().min(2).optional(),
  options: z
    .tuple([
      questionOptionSchema,
      questionOptionSchema,
      questionOptionSchema,
      questionOptionSchema,
    ])
    .optional(),
  correctAnswer: z.enum(["A", "B", "C", "D"]).optional(),
  difficulty: difficultySchema.optional(),
  chapter: z.string().max(80).optional().nullable(),
  point: z.coerce.number().min(0.1).max(100).optional(),
});

export const questionListQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  subjectId: objectIdString.optional(),
  difficulty: difficultySchema.optional(),
  chapter: z.string().optional(),
  search: z.string().optional(),
});

export const questionImportSchema = z.object({
  rows: z.array(z.record(z.unknown())).min(1),
});

export const examCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    subjectId: objectIdString,
    questionIds: z.array(objectIdString).optional(),
    randomConfig: z
      .object({
        easy: z.coerce.number().int().min(0).default(0),
        medium: z.coerce.number().int().min(0).default(0),
        hard: z.coerce.number().int().min(0).default(0),
      })
      .optional(),
    duration: z.coerce.number().int().min(1).max(600),
    startTime: z.string(),
    endTime: z.string(),
    assignedClassIds: z.array(objectIdString).default([]),
    shuffleQuestions: z.boolean().default(true),
    shuffleOptions: z.boolean().default(true),
  })
  .refine((d) => Boolean(d.questionIds?.length) || Boolean(d.randomConfig), {
    message: "Cần cung cấp questionIds hoặc randomConfig",
  })
  .refine(
    (d) => (d.randomConfig
      ? d.randomConfig.easy + d.randomConfig.medium + d.randomConfig.hard > 0
      : true),
    { message: "randomConfig phải có ít nhất 1 câu", path: ["randomConfig"] },
  )
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: "endTime phải sau startTime",
    path: ["endTime"],
  });

export const examListQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
  subjectId: objectIdString.optional(),
});

export const startExamViolationSchema = z.object({
  type: z.string().min(1).max(40),
});

export const startExamSaveAnswerSchema = z.object({
  questionId: objectIdString,
  selectedOption: z.enum(["A", "B", "C", "D"]),
});
