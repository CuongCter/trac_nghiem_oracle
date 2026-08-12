import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import type { Role } from "../constants";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export function signToken(payload: AuthTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & AuthTokenPayload;
  if (!decoded || !decoded.sub || !decoded.email || !decoded.role) {
    throw new Error("Invalid token payload");
  }
  return { sub: decoded.sub, email: decoded.email, role: decoded.role as Role };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
