import { z } from "zod";

export const objectIdString = z
  .string()
  .min(1, "ID is required")
  .regex(/^\d+$/, "ID must be a positive integer");

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  search: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const roleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const examStatusSchema = z.enum(["DRAFT", "PUBLISHED", "CLOSED"]);
export const userStatusSchema = z.enum(["ACTIVE", "LOCKED"]);
export const attemptStatusSchema = z.enum(["IN_PROGRESS", "SUBMITTED", "EXPIRED"]);
export const optionLabelSchema = z.enum(["A", "B", "C", "D"]);
