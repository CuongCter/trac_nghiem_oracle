import type { Response } from "express";
import type { ApiEnvelope } from "../types/api";
import { AppError } from "./errors";

export function success<T>(res: Response, data: T, message?: string, status = 200): Response {
  const payload: ApiEnvelope<T> = { success: true, data, message };
  return res.status(status).json(payload);
}

export function ok<T>(res: Response, data: T, message?: string): Response {
  return success(res, data, message, 200);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return success(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function fail(
  res: Response,
  status: number,
  message: string,
  errors?: Array<{ field: string; message: string }>,
): Response {
  const payload: ApiEnvelope<never> = { success: false, message, errors };
  return res.status(status).json(payload);
}

export function handleError(res: Response, err: unknown): Response {
  if (err instanceof AppError) {
    return fail(res, err.status, err.message, err.errors);
  }
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return fail(res, 500, message);
}
