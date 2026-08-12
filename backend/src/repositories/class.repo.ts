import { execute, withTransaction } from "../config/database";
import oracledb from "oracledb";
import type { ClassEntity, UserRef } from "../types/domain";

interface ClassRow {
  ID: number;
  NAME: string;
  TEACHER_ID: number | null;
  TEACHER_NAME: string | null;
  TEACHER_EMAIL: string | null;
}

interface StudentRow {
  STUDENT_ID: number;
  FULL_NAME: string;
  EMAIL: string;
}

function toClass(row: ClassRow, students: StudentRow[]): ClassEntity {
  let teacher: UserRef | null = null;
  if (row.TEACHER_ID != null) {
    teacher = {
      _id: String(row.TEACHER_ID),
      fullName: row.TEACHER_NAME ?? "",
      email: row.TEACHER_EMAIL ?? "",
    };
  }
  return {
    _id: String(row.ID),
    name: row.NAME,
    teacherId: teacher,
    students: students.map((s) => ({ _id: String(s.STUDENT_ID), fullName: s.FULL_NAME, email: s.EMAIL })),
  };
}

async function loadClass(row: ClassRow): Promise<ClassEntity> {
  const { rows: studs } = await execute<StudentRow>(
    `SELECT cs.STUDENT_ID, u.FULL_NAME, u.EMAIL
     FROM CLASS_STUDENTS cs JOIN USERS u ON cs.STUDENT_ID = u.ID
     WHERE cs.CLASS_ID = :id ORDER BY u.FULL_NAME`,
    { id: row.ID },
  );
  return toClass(row, studs);
}

export const classRepo = {
  async findById(id: number): Promise<ClassEntity | null> {
    const { rows } = await execute<ClassRow>(
      `SELECT c.ID, c.NAME, c.TEACHER_ID,
              u.FULL_NAME AS TEACHER_NAME, u.EMAIL AS TEACHER_EMAIL
       FROM CLASSES c LEFT JOIN USERS u ON c.TEACHER_ID = u.ID
       WHERE c.ID = :id`,
      { id },
    );
    if (rows.length === 0) return null;
    return loadClass(rows[0]);
  },

  async listAll(search?: string): Promise<ClassEntity[]> {
    const binds: Record<string, unknown> = {};
    let where = "";
    if (search) {
      where = `WHERE LOWER(c.NAME) LIKE :search`;
      binds.search = `%${search.toLowerCase()}%`;
    }
    const { rows } = await execute<ClassRow>(
      `SELECT c.ID, c.NAME, c.TEACHER_ID,
              u.FULL_NAME AS TEACHER_NAME, u.EMAIL AS TEACHER_EMAIL
       FROM CLASSES c LEFT JOIN USERS u ON c.TEACHER_ID = u.ID
       ${where}
       ORDER BY c.NAME`,
      binds,
    );
    const items: ClassEntity[] = [];
    for (const r of rows) {
      items.push(await loadClass(r));
    }
    return items;
  },

  async create(input: { name: string; teacherId?: number | null; students: number[] }): Promise<ClassEntity> {
    const id = await withTransaction(async (conn) => {
      const result = await conn.execute<{ ID: number }>(
        `INSERT INTO CLASSES (NAME, TEACHER_ID) VALUES (:name, :teacherId)
         RETURNING ID INTO :id`,
        {
          name: input.name,
          teacherId: input.teacherId ?? null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      const newId = result.outBinds?.id as number;
      for (const sid of input.students) {
        await conn.execute(
          "INSERT INTO CLASS_STUDENTS (CLASS_ID, STUDENT_ID) VALUES (:cid, :sid)",
          { cid: newId, sid },
        );
      }
      return newId;
    });
    const created = await classRepo.findById(id);
    if (!created) throw new Error("Failed to load created class");
    return created;
  },

  async update(
    id: number,
    input: Partial<{ name: string; teacherId: number | null; students: number[] }>,
  ): Promise<ClassEntity | null> {
    await withTransaction(async (conn) => {
      const sets: string[] = [];
      const binds: Record<string, unknown> = { id };
      if (input.name !== undefined) {
        sets.push("NAME = :name");
        binds.name = input.name;
      }
      if (input.teacherId !== undefined) {
        sets.push("TEACHER_ID = :teacherId");
        binds.teacherId = input.teacherId;
      }
      sets.push("UPDATED_AT = SYSTIMESTAMP");
      if (sets.length > 1) {
        await conn.execute(`UPDATE CLASSES SET ${sets.join(", ")} WHERE ID = :id`, binds);
      }
      if (input.students) {
        await conn.execute("DELETE FROM CLASS_STUDENTS WHERE CLASS_ID = :id", { id });
        for (const sid of input.students) {
          await conn.execute(
            "INSERT INTO CLASS_STUDENTS (CLASS_ID, STUDENT_ID) VALUES (:cid, :sid)",
            { cid: id, sid },
          );
        }
      }
    });
    return this.findById(id);
  },

  async remove(id: number): Promise<boolean> {
    const { rowsAffected } = await execute("DELETE FROM CLASSES WHERE ID = :id", { id });
    return rowsAffected > 0;
  },

  async findClassIdsForStudent(studentId: number): Promise<number[]> {
    const { rows } = await execute<{ CLASS_ID: number }>(
      "SELECT CLASS_ID FROM CLASS_STUDENTS WHERE STUDENT_ID = :sid",
      { sid: studentId },
    );
    return rows.map((r) => r.CLASS_ID);
  },

  async isStudentInAnyClass(studentId: number, classIds: number[]): Promise<boolean> {
    if (classIds.length === 0) return false;
    const binds: Record<string, unknown> = { sid: studentId };
    const placeholders = classIds.map((_, i) => `:cls${i}`).join(",");
    classIds.forEach((cid, i) => {
      binds[`cls${i}`] = cid;
    });
    const { rows } = await execute<{ C: number }>(
      `SELECT COUNT(*) AS C FROM CLASS_STUDENTS
       WHERE STUDENT_ID = :sid AND CLASS_ID IN (${placeholders})`,
      binds,
    );
    return Number(rows[0]?.C ?? 0) > 0;
  },
};
