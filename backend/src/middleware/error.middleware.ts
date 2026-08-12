import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { fail } from "../utils/response";

export function notFound(_req: Request, res: Response): void {
  fail(res, 404, "Resource not found");
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const errors = (err.issues ?? []).map((i) => ({ field: i.path.join("."), message: i.message }));
    fail(res, 400, "Validation failed", errors);
    return;
  }
  if (err instanceof AppError) {
    fail(res, err.status, err.message, err.errors);
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[unhandled-error]", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  fail(res, 500, message);
}
