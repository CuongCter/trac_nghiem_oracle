// Ambient declarations for oracledb (slim surface used by the backend).
// Oracle ships full TS types via `npm install @types/oracledb` historically; to avoid
// pulling that package we declare only the APIs our code touches.

declare module "oracledb" {
  export const OUT_FORMAT_OBJECT: number;
  export const BIND_OUT: number;
  export const NUMBER: number;
  export const STRING: number;
  export const DATE: number;

  export interface Connection {
    execute<T = unknown>(
      sql: string,
      binds?: Record<string, unknown> | unknown[] | null,
      options?: ExecuteOptions,
    ): Promise<ExecuteResult<T>>;
    executeMany(
      sql: string,
      binds?: unknown[] | Record<string, unknown>[],
      options?: ExecuteManyOptions,
    ): Promise<ExecuteManyResult>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    close(): Promise<void>;
  }

  export interface ExecuteOptions {
    autoCommit?: boolean;
    outFormat?: number;
  }

  export interface ExecuteManyOptions {
    autoCommit?: boolean;
    batchErrors?: boolean;
  }

  export interface ExecuteResult<T = unknown> {
    rows?: T[];
    rowsAffected?: number;
    outBinds?: Record<string, unknown>;
    metaData?: unknown[];
  }

  export interface ExecuteManyResult {
    rowsAffected?: number;
  }

  export interface PoolAttributes {
    poolMin: number;
    poolMax: number;
    poolIncrement: number;
    poolTimeout: number;
    user: string;
    password: string;
    connectString: string;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(n?: number): Promise<void>;
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
    poolTimeout?: number;
  }

  export function createPool(attrs: PoolAttributes): Promise<Pool>;
  let autoCommit: boolean;
  let outFormat: number;
}
