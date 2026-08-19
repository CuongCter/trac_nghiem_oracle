import { execute, withTransaction } from "../config/database";
import oracledb from "oracledb";
import type { Subject, UserRef } from "../types/domain";

interface SubjectRow {
  ID: number;
  NAME: string;
  CODE: string;
  DESCRIPTION: string | null;
  CREATED_BY: number | null;
  CREATED_AT: Date;
  UPDATED_AT: Date;
  CREATED_BY_NAME?: string | null;
  CREATED_BY_EMAIL?: string | null;
}

function toSubject(row: SubjectRow): Subject {
  const createdBy: UserRef | null =
    row.CREATED_BY && row.CREATED_BY_NAME
      ? { _id: String(row.CREATED_BY), fullName: row.CREATED_BY_NAME, email: row.CREATED_BY_EMAIL ?? "" }
      : row.CREATED_BY
        ? { _id: String(row.CREATED_BY), fullName: "", email: "" }
        : null;
  return {
    _id: String(row.ID),
    name: row.NAME,
    code: row.CODE,
    description: row.DESCRIPTION ?? null,
    createdBy,
    createdAt: row.CREATED_AT.toISOString(),
    updatedAt: row.UPDATED_AT.toISOString(),
  };
}

const SUBJECT_SELECT = `
  SELECT s.ID, s.NAME, s.CODE, s.DESCRIPTION, s.CREATED_BY, s.CREATED_AT, s.UPDATED_AT,
         u.FULL_NAME AS CREATED_BY_NAME, u.EMAIL AS CREATED_BY_EMAIL
  FROM SUBJECTS s LEFT JOIN USERS u ON s.CREATED_BY = u.ID
`;

export const subjectRepo = {
  async findById(id: number): Promise<Subject | null> {
    const { rows } = await execute<SubjectRow>(`${SUBJECT_SELECT} WHERE s.ID = :id`, { id });
    if (rows.length === 0) return null;
    return toSubject(rows[0]);
  },

  async list(args: { page: number; limit: number; search?: string }): Promise<{ items: Subject[]; total: number }> {
    const binds: Record<string, unknown> = {};
    let where = "";
    if (args.search) {
      where = `WHERE LOWER(s.NAME) LIKE :search OR LOWER(s.CODE) LIKE :search`;
      binds.search = `%${args.search.toLowerCase()}%`;
    }

    const itemsQuery = `SELECT * FROM (
        SELECT t.*, ROWNUM rn FROM (
          ${SUBJECT_SELECT} ${where} ORDER BY s.CREATED_AT DESC
        ) t WHERE ROWNUM <= :maxRow
      ) WHERE rn > :offset`;
    const countQuery = `SELECT COUNT(*) AS C FROM SUBJECTS s ${where}`;

    const offset = (args.page - 1) * args.limit;
    const maxRow = args.page * args.limit;

    const [{ rows: items }, { rows: countRows }] = await Promise.all([
      execute<SubjectRow>(itemsQuery, { ...binds, maxRow, offset }),
      execute<{ C: number }>(countQuery, binds),
    ]);
    return { items: items.map(toSubject), total: Number(countRows[0]?.C ?? 0) };
  },

  async listAll(): Promise<Subject[]> {
    const { items } = await this.list({ page: 1, limit: 200 });
    return items;
  },

  async create(input: { name: string; code: string; description?: string; createdBy: number }): Promise<Subject> {
    const result = await withTransaction(async (conn) => {
      const res = await conn.execute(
        `INSERT INTO SUBJECTS (NAME, CODE, DESCRIPTION, CREATED_BY)
         VALUES (:p_name, :p_code, :p_description, :p_createdBy)
         RETURNING ID INTO :out_id`,
        {
          p_name: input.name,
          p_code: input.code,
          p_description: input.description ?? null,
          p_createdBy: input.createdBy,
          out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      return res.outBinds;
    });

    if (!result) throw new Error("Failed to create subject");

    const outId = result.out_id as number | number[];
    const id = Array.isArray(outId) ? outId[0] : outId;

    const s = await this.findById(id);
    if (!s) throw new Error("Failed to load created subject");
    return s;
  },

  async update(
    id: number,
    input: Partial<{ name: string; code: string; description: string }>,
  ): Promise<Subject | null> {
    const sets: string[] = [];
    const binds: Record<string, unknown> = { id };
    if (input.name !== undefined) { sets.push("NAME = :name"); binds.name = input.name; }
    if (input.code !== undefined) { sets.push("CODE = :code"); binds.code = input.code; }
    if (input.description !== undefined) { sets.push("DESCRIPTION = :description"); binds.description = input.description; }
    sets.push("UPDATED_AT = SYSTIMESTAMP");
    if (sets.length === 1) return this.findById(id);
    await withTransaction(async (conn) => {
      await conn.execute(`UPDATE SUBJECTS SET ${sets.join(", ")} WHERE ID = :id`, binds);
    });
    return this.findById(id);
  },

  async remove(id: number): Promise<boolean> {
    return withTransaction(async (conn) => {
      const res = await conn.execute("DELETE FROM SUBJECTS WHERE ID = :id", { id });
      return (res.rowsAffected ?? 0) > 0;
    });
  },
};
