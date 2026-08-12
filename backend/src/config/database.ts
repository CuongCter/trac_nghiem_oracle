import oracledb from "oracledb";
import { env } from "./env";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false;

let initialized = false;
let pool: oracledb.Pool | null = null;

export async function initPool(): Promise<oracledb.Pool> {
  if (initialized && pool) return pool;
  pool = await oracledb.createPool({
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    connectString: env.DB_CONNECT_STRING,
    poolMin: env.DB_POOL_MIN,
    poolMax: env.DB_POOL_MAX,
    poolIncrement: env.DB_POOL_INCREMENT,
    poolTimeout: 60,
  });
  initialized = true;
  return pool;
}

export async function getPool(): Promise<oracledb.Pool> {
  if (!pool) {
    await initPool();
  }
  return pool as oracledb.Pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(10);
    pool = null;
    initialized = false;
  }
}

export async function ping(): Promise<boolean> {
  try {
    const p = await getPool();
    const conn = await p.getConnection();
    try {
      await conn.execute("SELECT 1 FROM DUAL");
      return true;
    } finally {
      await conn.close();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] ping failed:", err);
    return false;
  }
}

export interface Run<T> {
  rows: T[];
  rowsAffected: number;
  outBinds?: Record<string, unknown>;
}

export async function withConnection<T>(fn: (conn: oracledb.Connection) => Promise<T>): Promise<T> {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    return await fn(conn);
  } finally {
    try {
      await conn.close();
    } catch {
      /* ignore */
    }
  }
}

export async function withTransaction<T>(fn: (conn: oracledb.Connection) => Promise<T>): Promise<T> {
  return withConnection(async (conn) => {
    try {
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        /* ignore */
      }
      throw err;
    }
  });
}

export async function execute<T = unknown>(
  sql: string,
  binds: Record<string, unknown> = {},
  options: oracledb.ExecuteOptions = {},
): Promise<Run<T>> {
  return withConnection(async (conn) => {
    const res = await conn.execute<T>(sql, binds, options);
    return {
      rows: (res.rows ?? []) as T[],
      rowsAffected: res.rowsAffected ?? 0,
      outBinds: res.outBinds as Record<string, unknown> | undefined,
    };
  });
}

export async function executeMany(
  sql: string,
  binds: Record<string, unknown>[] = [],
  options: oracledb.ExecuteManyOptions = {},
): Promise<number> {
  return withConnection(async (conn) => {
    const res = await conn.executeMany(sql, binds, options);
    return res.rowsAffected ?? 0;
  });
}
