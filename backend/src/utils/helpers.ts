import type { Pagination } from "../types/api";

export interface BuildPaginationArgs {
  page: number;
  limit: number;
  total: number;
}

export function buildPagination({ page, limit, total }: BuildPaginationArgs): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages };
}

export function clampPage(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function clampLimit(value: unknown, fallback: number, max = 200): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.floor(n));
}

export function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  // oracledb may return Buffer; coerce via String.
  return String(value);
}

export function asNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function asBooleanFlag(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).toUpperCase().trim();
  return s === "Y" || s === "1" || s === "TRUE";
}

export function flagToChar(value: boolean): "Y" | "N" {
  return value ? "Y" : "N";
}

export function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}
