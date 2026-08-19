import { execute, withTransaction } from "../config/database";
import oracledb from "oracledb";
import type { ClassRef, Exam, ExamStatus, Subject, UserRef } from "../types/domain";

interface ExamRow {
  ID: number;
  TITLE: string;
  SUBJECT_ID: number;
  SUBJECT_NAME?: string;
  SUBJECT_CODE?: string;
  DURATION_MINUTES: number;
  TOTAL_QUESTIONS: number;
  TOTAL_POINTS: number;
  START_TIME: Date;
  END_TIME: Date;
  STATUS: ExamStatus;
  SHUFFLE_QUESTIONS: string;
  SHUFFLE_OPTIONS: string;
  CREATED_BY: number | null;
  CREATED_BY_NAME?: string | null;
  CREATED_BY_EMAIL?: string | null;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

function boolFlag(v: unknown): boolean {
  if (typeof v === "string") return v === "Y" || v === "1" || v.toUpperCase() === "TRUE";
  if (typeof v === "number") return v === 1;
  return false;
}

function toExam(row: ExamRow, questionIds: number[], assignedClassIds: number[]): Exam {
  const createdBy: UserRef | null =
    row.CREATED_BY == null
      ? null
      : row.CREATED_BY_NAME
        ? { _id: String(row.CREATED_BY), fullName: row.CREATED_BY_NAME, email: row.CREATED_BY_EMAIL ?? "" }
        : { _id: String(row.CREATED_BY), fullName: "", email: "" };

  const subject: Subject | undefined =
    row.SUBJECT_NAME && row.SUBJECT_CODE
      ? { _id: String(row.SUBJECT_ID), name: row.SUBJECT_NAME, code: row.SUBJECT_CODE }
      : undefined;

  return {
    _id: String(row.ID),
    title: row.TITLE,
    subjectId: subject ?? String(row.SUBJECT_ID),
    questionIds: questionIds.map(String),
    duration: Number(row.DURATION_MINUTES),
    totalQuestions: Number(row.TOTAL_QUESTIONS),
    totalPoints: Number(row.TOTAL_POINTS),
    startTime: row.START_TIME.toISOString(),
    endTime: row.END_TIME.toISOString(),
    assignedClassIds: assignedClassIds.map((id) => {
      // return id only; populated separately via subjects/classes endpoint as needed
      void null;
      return { _id: String(id), name: "" } as ClassRef;
    }) as ClassRef[],
    status: row.STATUS,
    shuffleQuestions: boolFlag(row.SHUFFLE_QUESTIONS),
    shuffleOptions: boolFlag(row.SHUFFLE_OPTIONS),
    createdBy,
    createdAt: row.CREATED_AT.toISOString(),
    updatedAt: row.UPDATED_AT.toISOString(),
  };
}

async function loadQuestions(examId: number): Promise<number[]> {
  const { rows } = await execute<{ QUESTION_ID: number }>(
    "SELECT QUESTION_ID FROM EXAM_QUESTIONS WHERE EXAM_ID = :eid ORDER BY POSITION NULLS LAST, QUESTION_ID",
    { eid: examId },
  );
  return rows.map((r) => r.QUESTION_ID);
}

async function loadAssignedClasses(examId: number): Promise<number[]> {
  const { rows } = await execute<{ CLASS_ID: number }>(
    "SELECT CLASS_ID FROM EXAM_CLASSES WHERE EXAM_ID = :eid",
    { eid: examId },
  );
  return rows.map((r) => r.CLASS_ID);
}

const EXAM_SELECT = `
  SELECT e.*, s.NAME AS SUBJECT_NAME, s.CODE AS SUBJECT_CODE,
         u.FULL_NAME AS CREATED_BY_NAME, u.EMAIL AS CREATED_BY_EMAIL
  FROM EXAMS e
  JOIN SUBJECTS s ON e.SUBJECT_ID = s.ID
  LEFT JOIN USERS u ON e.CREATED_BY = u.ID
`;

export const examRepo = {
  async findById(id: number): Promise<Exam | null> {
    const { rows } = await execute<ExamRow>(`${EXAM_SELECT} WHERE e.ID = :id`, { id });
    if (rows.length === 0) return null;
    const [questions, classes] = await Promise.all([loadQuestions(id), loadAssignedClasses(id)]);
    return toExam(rows[0], questions, classes);
  },

  async list(args: {
    page: number;
    limit: number;
    search?: string;
    status?: ExamStatus;
    subjectId?: number;
    createdBy?: number;
  }): Promise<{ items: Exam[]; total: number }> {
    const where: string[] = [];
    const binds: Record<string, unknown> = {};
    if (args.search) {
      where.push("LOWER(e.TITLE) LIKE :search");
      binds.search = `%${args.search.toLowerCase()}%`;
    }
    if (args.status) {
      where.push("e.STATUS = :status");
      binds.status = args.status;
    }
    if (args.subjectId !== undefined) {
      where.push("e.SUBJECT_ID = :subjectId");
      binds.subjectId = args.subjectId;
    }
    if (args.createdBy !== undefined) {
      where.push("e.CREATED_BY = :createdBy");
      binds.createdBy = args.createdBy;
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const base = `${EXAM_SELECT} ${whereClause}`;
    const itemsQuery = `SELECT * FROM (
        SELECT t.*, ROWNUM rn FROM (
          ${base} ORDER BY e.CREATED_AT DESC
        ) t WHERE ROWNUM <= :maxRow
      ) WHERE rn > :offset`;
    const countQuery = `SELECT COUNT(*) AS C FROM EXAMS e ${whereClause}`;

    const offset = (args.page - 1) * args.limit;
    const maxRow = args.page * args.limit;

    const [{ rows: items }, { rows: countRows }] = await Promise.all([
      execute<ExamRow>(itemsQuery, { ...binds, maxRow, offset }),
      execute<{ C: number }>(countQuery, binds),
    ]);
    const exams: Exam[] = [];
    for (const r of items) {
      const [questions, classes] = await Promise.all([loadQuestions(r.ID), loadAssignedClasses(r.ID)]);
      exams.push(toExam(r, questions, classes));
    }
    return { items: exams, total: Number(countRows[0]?.C ?? 0) };
  },

  async listForStudent(studentId: number): Promise<Exam[]> {
    const { rows } = await execute<ExamRow>(
      `SELECT DISTINCT e.*, s.NAME AS SUBJECT_NAME, s.CODE AS SUBJECT_CODE,
              u.FULL_NAME AS CREATED_BY_NAME, u.EMAIL AS CREATED_BY_EMAIL
       FROM EXAMS e
       JOIN SUBJECTS s ON e.SUBJECT_ID = s.ID
       LEFT JOIN USERS u ON e.CREATED_BY = u.ID
       JOIN EXAM_CLASSES ec ON e.ID = ec.EXAM_ID
       JOIN CLASS_STUDENTS cs ON cs.CLASS_ID = ec.CLASS_ID
       WHERE cs.STUDENT_ID = :sid
         AND e.STATUS = 'PUBLISHED'
         AND e.START_TIME <= SYSTIMESTAMP
         AND e.END_TIME >= SYSTIMESTAMP
         AND NOT EXISTS (
           SELECT 1 FROM EXAM_ATTEMPTS a WHERE a.EXAM_ID = e.ID AND a.STUDENT_ID = :sid2
         )
       ORDER BY e.START_TIME ASC`,
      { sid: studentId, sid2: studentId },
    );
    const exams: Exam[] = [];
    for (const r of rows) {
      const [questions, classes] = await Promise.all([loadQuestions(r.ID), loadAssignedClasses(r.ID)]);
      exams.push(toExam(r, questions, classes));
    }
    return exams;
  },

  async create(input: {
    title: string;
    subjectId: number;
    durationMinutes: number;
    startTime: Date;
    endTime: Date;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    createdBy: number;
    questions: Array<{ questionId: number; point: number; correctAnswer: string; content: string }>;
    assignedClassIds: number[];
  }): Promise<number> {
    const totalQuestions = input.questions.length;
    const totalPoints = input.questions.reduce((acc, q) => acc + Number(q.point), 0);
    return withTransaction(async (conn) => {
      const result = await conn.execute<{ ID: number }>(
        `INSERT INTO EXAMS (TITLE, SUBJECT_ID, DURATION_MINUTES, TOTAL_QUESTIONS, TOTAL_POINTS,
          START_TIME, END_TIME, STATUS, SHUFFLE_QUESTIONS, SHUFFLE_OPTIONS, CREATED_BY)
         VALUES (:title, :subjectId, :duration, :totalQuestions, :totalPoints,
          :startTime, :endTime, 'DRAFT', :shuffleQ, :shuffleO, :createdBy)
         RETURNING ID INTO :id`,
        {
          title: input.title,
          subjectId: input.subjectId,
          duration: input.durationMinutes,
          totalQuestions,
          totalPoints,
          startTime: input.startTime,
          endTime: input.endTime,
          shuffleQ: input.shuffleQuestions ? "Y" : "N",
          shuffleO: input.shuffleOptions ? "Y" : "N",
          createdBy: input.createdBy,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      const examId = result.outBinds?.id as number;
      for (let i = 0; i < input.questions.length; i++) {
        await conn.execute(
          `INSERT INTO EXAM_QUESTIONS (EXAM_ID, QUESTION_ID, POSITION) VALUES (:eid, :qid, :pos)`,
          { eid: examId, qid: input.questions[i].questionId, pos: i + 1 },
        );
      }
      for (const classId of input.assignedClassIds) {
        await conn.execute(
          `INSERT INTO EXAM_CLASSES (EXAM_ID, CLASS_ID) VALUES (:eid, :cid)`,
          { eid: examId, cid: classId },
        );
      }
      return examId;
    });
  },

  async setStatus(id: number, status: ExamStatus): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE EXAMS SET STATUS = :status, UPDATED_AT = SYSTIMESTAMP WHERE ID = :id`,
        { status, id },
      );
    });
  },

  async remove(id: number): Promise<boolean> {
    return withTransaction(async (conn) => {
      const res = await conn.execute("DELETE FROM EXAMS WHERE ID = :id", { id });
      return (res.rowsAffected ?? 0) > 0;
    });
  },

  async findOwnersForExam(examId: number): Promise<string[]> {
    const { rows } = await execute<{ CREATED_BY: number }>(
      "SELECT CREATED_BY FROM EXAMS WHERE ID = :id",
      { id: examId },
    );
    return rows.map((r) => String(r.CREATED_BY));
  },
};
