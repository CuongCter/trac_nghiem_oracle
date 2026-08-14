import oracledb from "oracledb";
import { execute, withTransaction } from "../config/database";
import type { Role, UserStatus } from "../constants";
import type { User } from "../types/domain";

interface UserRow {
  ID: number;
  FULL_NAME: string;
  EMAIL: string;
  PASSWORD_HASH: string;
  ROLE: Role;
  STATUS: UserStatus;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

function toUser(row: UserRow): User {
  return {
    _id: String(row.ID),
    fullName: row.FULL_NAME,
    email: row.EMAIL,
    role: row.ROLE,
    status: row.STATUS,
    createdAt: row.CREATED_AT.toISOString(),
    updatedAt: row.UPDATED_AT.toISOString(),
  };
}

export const userRepo = {
  async findById(id: number): Promise<User | null> {
    const { rows } = await execute<UserRow>("SELECT * FROM USERS WHERE ID = :id", { id });
    if (rows.length === 0) return null;
    return toUser(rows[0]);
  },

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const { rows } = await execute<UserRow>(
      "SELECT * FROM USERS WHERE LOWER(EMAIL) = LOWER(:email)",
      { email },
    );
    if (rows.length === 0) return null;
    return { ...toUser(rows[0]), passwordHash: rows[0].PASSWORD_HASH };
  },

  async list(args: {
    page: number;
    limit: number;
    search?: string;
    role?: Role;
    status?: UserStatus;
  }): Promise<{ items: User[]; total: number }> {
    const where: string[] = [];
    const binds: Record<string, unknown> = {};

    if (args.search) {
      where.push("(LOWER(FULL_NAME) LIKE :search OR LOWER(EMAIL) LIKE :search)");
      binds.search = `%${args.search.toLowerCase()}%`;
    }
    if (args.role) {
      where.push("ROLE = :role");
      binds.role = args.role;
    }
    if (args.status) {
      where.push("STATUS = :status");
      binds.status = args.status;
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const base = `FROM USERS ${whereClause}`;

    const itemsQuery = `SELECT * FROM (
        SELECT t.*, ROWNUM rn FROM (
          SELECT * ${base} ORDER BY CREATED_AT DESC
        ) t WHERE ROWNUM <= :maxRow
      ) WHERE rn > :offset`;
    const countQuery = `SELECT COUNT(*) AS C FROM USERS ${whereClause}`;

    const offset = (args.page - 1) * args.limit;
    const maxRow = args.page * args.limit;

    const [{ rows: items }, { rows: countRows }] = await Promise.all([
      execute<UserRow>(itemsQuery, { ...binds, maxRow, offset }),
      execute<{ C: number }>(countQuery, binds),
    ]);
    return { items: items.map(toUser), total: Number(countRows[0]?.C ?? 0) };
  },

  async create(input: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: Role;
    status: UserStatus;
  }): Promise<User> {
    const result = await withTransaction(async (conn) => {
      const res = await conn.execute(
        `INSERT INTO USERS (FULL_NAME, EMAIL, PASSWORD_HASH, ROLE, STATUS)
         VALUES (:p_fullName, :p_email, :p_passwordHash, :p_role, :p_status)
         RETURNING ID, FULL_NAME, EMAIL, ROLE, STATUS, CREATED_AT, UPDATED_AT INTO :out_id, :out_fullName, :out_email, :out_role, :out_status, :out_createdAt, :out_updatedAt`,
        {
          p_fullName: input.fullName,
          p_email: input.email,
          p_passwordHash: input.passwordHash,
          p_role: input.role,
          p_status: input.status,
          out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          out_fullName: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 200 },
          out_email: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 },
          out_role: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 },
          out_status: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 },
          out_createdAt: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
          out_updatedAt: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
        },
      );
      return res.outBinds;
    });

    if (!result) throw new Error("Failed to create user");

    const row = result as {
      out_id: number;
      out_fullName: string;
      out_email: string;
      out_role: Role;
      out_status: UserStatus;
      out_createdAt: string | Date;
      out_updatedAt: string | Date;
    };

    const createdAt = row.out_createdAt instanceof Date
      ? row.out_createdAt.toISOString()
      : String(row.out_createdAt);
    const updatedAt = row.out_updatedAt instanceof Date
      ? row.out_updatedAt.toISOString()
      : String(row.out_updatedAt);

    return {
      _id: String(row.out_id),
      fullName: row.out_fullName,
      email: row.out_email,
      role: row.out_role,
      status: row.out_status,
      createdAt,
      updatedAt,
    };
  },

  async update(
    id: number,
    patch: Partial<{
      fullName: string;
      email: string;
      passwordHash: string;
      role: Role;
      status: UserStatus;
    }>,
  ): Promise<User | null> {
    const sets: string[] = [];
    const binds: Record<string, unknown> = { id };
    if (patch.fullName !== undefined) {
      sets.push("FULL_NAME = :fullName");
      binds.fullName = patch.fullName;
    }
    if (patch.email !== undefined) {
      sets.push("EMAIL = :email");
      binds.email = patch.email;
    }
    if (patch.passwordHash !== undefined) {
      sets.push("PASSWORD_HASH = :passwordHash");
      binds.passwordHash = patch.passwordHash;
    }
    if (patch.role !== undefined) {
      sets.push("ROLE = :role");
      binds.role = patch.role;
    }
    if (patch.status !== undefined) {
      sets.push("STATUS = :status");
      binds.status = patch.status;
    }
    sets.push("UPDATED_AT = SYSTIMESTAMP");
    if (sets.length === 1) return this.findById(id);

    await execute(`UPDATE USERS SET ${sets.join(", ")} WHERE ID = :id`, binds);
    return this.findById(id);
  },

  async remove(id: number): Promise<boolean> {
    const { rowsAffected } = await execute("DELETE FROM USERS WHERE ID = :id", { id });
    return rowsAffected > 0;
  },
};
