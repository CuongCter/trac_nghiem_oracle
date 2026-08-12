/** Roles in the system */
export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** User status */
export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

/** Question difficulty */
export const DIFFICULTY = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const;
export type Difficulty = (typeof DIFFICULTY)[keyof typeof DIFFICULTY];

/** Exam status */
export const EXAM_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CLOSED: "CLOSED",
} as const;
export type ExamStatus = (typeof EXAM_STATUS)[keyof typeof EXAM_STATUS];

/** Exam attempt status */
export const ATTEMPT_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  EXPIRED: "EXPIRED",
} as const;
export type AttemptStatus = (typeof ATTEMPT_STATUS)[keyof typeof ATTEMPT_STATUS];

/** Option labels for multi-choice */
export const OPTION_LABELS = ["A", "B", "C", "D"] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

/** Anti-cheat: max times a student may switch tabs before auto-submit */
export const MAX_TAB_SWITCH = 3;

/** Time warning thresholds */
export const COUNTDOWN_WARNING_MS = 5 * 60 * 1000; // 5 minutes
export const COUNTDOWN_CRITICAL_MS = 60 * 1000; // 1 minute

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];

/** Local storage keys */
export const STORAGE_KEYS = {
  AUTH: "auth-storage",
  EXAM_DRAFT: "exam-draft",
} as const;

/** API base — read from env in the browser, fallback for dev */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/** Default routes per role */
export const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin/users",
  TEACHER: "/teacher/questions",
  STUDENT: "/student/exams",
};

/** All roles used for permission checks */
export const ALL_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT] as const;
