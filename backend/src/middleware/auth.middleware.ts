import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { verifyToken, type AuthTokenPayload } from "../utils/auth";
import type { Role } from "../constants";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing Bearer token"));
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function authorize(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(new UnauthorizedError("Not authenticated"));
    if (!allowed.includes(req.auth.role)) {
      return next(new ForbiddenError("Bạn không có quyền thực hiện thao tác này"));
    }
    next();
  };
}
