import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function readEnv(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return v;
}

function readEnvNumber(key: string, fallback?: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") {
    if (fallback === undefined) throw new Error(`Missing required env: ${key}`);
    return fallback;
  }
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Invalid number for env: ${key}`);
  return n;
}

export const env = {
  PORT: readEnvNumber("PORT", 5000),
  NODE_ENV: readEnv("NODE_ENV", "development"),

  DB_USER: readEnv("DB_USER", "tracnghiem"),
  DB_PASSWORD: readEnv("DB_PASSWORD", "tracnghiem"),
  DB_CONNECT_STRING: readEnv("DB_CONNECT_STRING", "localhost:1521/ORCLPDB1"),
  DB_POOL_MIN: readEnvNumber("DB_POOL_MIN", 2),
  DB_POOL_MAX: readEnvNumber("DB_POOL_MAX", 10),
  DB_POOL_INCREMENT: readEnvNumber("DB_POOL_INCREMENT", 1),

  JWT_SECRET: readEnv("JWT_SECRET", "dev-only-secret-please-rotate"),
  JWT_EXPIRES_IN: readEnv("JWT_EXPIRES_IN", "8h"),
  BCRYPT_ROUNDS: readEnvNumber("BCRYPT_ROUNDS", 10),

  CORS_ORIGIN: readEnv("CORS_ORIGIN", "http://localhost:3000"),

  PASS_SCORE: readEnvNumber("PASS_SCORE", 5),
  SCORE_MAX: readEnvNumber("SCORE_MAX", 10),
};

export type Env = typeof env;
