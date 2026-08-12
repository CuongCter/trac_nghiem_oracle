import { execute, withTransaction } from "../config/database";
import oracledb from "oracledb";
import type { Question, QuestionOption, OptionLabel, Difficulty } from "../types/domain";

interface QuestionRow {
  ID: number;
  SUBJECT_ID: number;
  CONTENT: string;
  OPTION_A: string;
  OPTION_B: string;
  OPTION_C: string;
  OPTION_D: string;
  CORRECT_ANSWER: OptionLabel;
  DIFFICULTY: Difficulty;
  CHAPTER: string | null;
  POINT: number;
  CREATED_BY: number | null;
  CREATED_BY_NAME: string | null;
  CREATED_BY_EMAIL: string | null;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

function toQuestion(row: QuestionRow, includeAnswer: boolean): Question {
  const opts: QuestionOption[] = [
    { label: "A", text: row.OPTION_A },
    { label: "B", text: row.OPTION_B },
    { label: "C", text: row.OPTION_C },
    { label: "D", text: row.OPTION_D },
  ];
  const createdBy =
    row.CREATED_BY == null
      ? null
      : row.CREATED_BY_NAME
        ? {
            _id: String(row.CREATED_BY),
            fullName: row.CREATED_BY_NAME,
            email: row.CREATED_BY_EMAIL ?? "",
          }
        : { _id: String(row.CREATED_BY), fullName: "", email: "" };

  return {
    _id: String(row.ID),
    subjectId: String(row.SUBJECT_ID),
    content: row.CONTENT,
    options: opts,
    difficulty: row.DIFFICULTY,
    chapter: row.CHAPTER ?? null,
    point: Number(row.POINT),
    createdBy,
    createdAt: row.CREATED_AT.toISOString(),
    updatedAt: row.UPDATED_AT.toISOString(),
    ...(includeAnswer ? { correctAnswer: row.CORRECT_ANSWER } : {}),
  } as Question;
}

const Q_SELECT = `
  SELECT q.ID, q.SUBJECT_ID, q.CONTENT, q.OPTION_A, q.OPTION_B, q.OPTION_C, q.OPTION_D,
         q.CORRECT_ANSWER, q.DIFFICULTY, q.CHAPTER, q.POINT, q.CREATED_BY, q.CREATED_AT, q.UPDATED_AT,
         u.FULL_NAME AS CREATED_BY_NAME, u.EMAIL AS CREATED_BY_EMAIL
  FROM QUESTIONS q LEFT JOIN USERS u ON q.CREATED_BY = u.ID
`;

export const questionRepo = {
  async findById(id: number, opts: { includeAnswer?: boolean } = {}): Promise<Question | null> {
    const { rows } = await execute<QuestionRow>(`${Q_SELECT} WHERE q.ID = :id`, { id });
    if (rows.length === 0) return null;
    return toQuestion(rows[0], !!opts.includeAnswer);
  },

  async list(args: {
    page: number;
    limit: number;
    subjectId?: number;
    difficulty?: Difficulty;
    chapter?: string;
    search?: string;
  }): Promise<{ items: Question[]; total: number }> {
    const where: string[] = [];
    const binds: Record<string, unknown> = {};
    if (args.subjectId !== undefined) {
      where.push("q.SUBJECT_ID = :subjectId");
      binds.subjectId = args.subjectId;
    }
    if (args.difficulty) {
      where.push("q.DIFFICULTY = :difficulty");
      binds.difficulty = args.difficulty;
    }
    if (args.chapter) {
      where.push("q.CHAPTER = :chapter");
      binds.chapter = args.chapter;
    }
    if (args.search) {
      where.push("LOWER(q.CONTENT) LIKE :search");
      binds.search = `%${args.search.toLowerCase()}%`;
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const base = `${Q_SELECT} ${whereClause}`;

    const itemsQuery = `SELECT * FROM (
        SELECT t.*, ROWNUM rn FROM (
          ${base} ORDER BY q.CREATED_AT DESC
        ) t WHERE ROWNUM <= :maxRow
      ) WHERE rn > :offset`;
    const countQuery = `SELECT COUNT(*) AS C FROM QUESTIONS q ${whereClause}`;

    const offset = (args.page - 1) * args.limit;
    const maxRow = args.page * args.limit;

    const [{ rows: items }, { rows: countRows }] = await Promise.all([
      execute<QuestionRow>(itemsQuery, { ...binds, maxRow, offset }),
      execute<{ C: number }>(countQuery, binds),
    ]);
    return { items: items.map((r) => toQuestion(r, false)), total: Number(countRows[0]?.C ?? 0) };
  },

  async findByIds(ids: number[], includeAnswer: boolean): Promise<Question[]> {
    if (ids.length === 0) return [];
    const binds: Record<string, unknown> = {};
    const placeholders = ids.map((_, i) => `:q${i}`).join(",");
    ids.forEach((id, i) => {
      binds[`q${i}`] = id;
    });
    const { rows } = await execute<QuestionRow>(
      `${Q_SELECT} WHERE q.ID IN (${placeholders})`,
      binds,
    );
    return rows.map((r) => toQuestion(r, includeAnswer));
  },

  async countBySubject(subjectId: number, difficulty?: Difficulty): Promise<number> {
    const binds: Record<string, unknown> = { sid: subjectId };
    let query = "SELECT COUNT(*) AS C FROM QUESTIONS WHERE SUBJECT_ID = :sid";
    if (difficulty) {
      query += " AND DIFFICULTY = :difficulty";
      binds.difficulty = difficulty;
    }
    const { rows } = await execute<{ C: number }>(query, binds);
    return Number(rows[0]?.C ?? 0);
  },

  async create(
    input: {
      subjectId: number;
      content: string;
      options: QuestionOption[];
      correctAnswer: OptionLabel;
      difficulty: Difficulty;
      chapter?: string | null;
      point: number;
      createdBy: number;
    },
  ): Promise<Question> {
    const byLabel = Object.fromEntries(input.options.map((o) => [o.label, o.text])) as Record<OptionLabel, string>;
    const id = await withTransaction(async (conn) => {
      const result = await conn.execute<{ ID: number }>(
        `INSERT INTO QUESTIONS (SUBJECT_ID, CONTENT, OPTION_A, OPTION_B, OPTION_C, OPTION_D,
          CORRECT_ANSWER, DIFFICULTY, CHAPTER, POINT, CREATED_BY)
         VALUES (:sid, :content, :optA, :optB, :optC, :optD, :correctAnswer, :difficulty, :chapter, :point, :createdBy)
         RETURNING ID INTO :id`,
        {
          sid: input.subjectId,
          content: input.content,
          optA: byLabel.A,
          optB: byLabel.B,
          optC: byLabel.C,
          optD: byLabel.D,
          correctAnswer: input.correctAnswer,
          difficulty: input.difficulty,
          chapter: input.chapter ?? null,
          point: input.point,
          createdBy: input.createdBy,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      return result.outBinds?.id as number;
    });
    const q = await this.findById(id, { includeAnswer: true });
    if (!q) throw new Error("Failed to load created question");
    return q;
  },

  async update(
    id: number,
    input: Partial<{
      subjectId: number;
      content: string;
      options: QuestionOption[];
      correctAnswer: OptionLabel;
      difficulty: Difficulty;
      chapter: string | null;
      point: number;
    }>,
  ): Promise<Question | null> {
    const sets: string[] = [];
    const binds: Record<string, unknown> = { id };
    if (input.subjectId !== undefined) {
      sets.push("SUBJECT_ID = :subjectId");
      binds.subjectId = input.subjectId;
    }
    if (input.content !== undefined) {
      sets.push("CONTENT = :content");
      binds.content = input.content;
    }
    if (input.options) {
      const byLabel = Object.fromEntries(input.options.map((o) => [o.label, o.text]));
      sets.push("OPTION_A = :optA");
      sets.push("OPTION_B = :optB");
      sets.push("OPTION_C = :optC");
      sets.push("OPTION_D = :optD");
      binds.optA = (byLabel as Record<string, string>).A;
      binds.optB = (byLabel as Record<string, string>).B;
      binds.optC = (byLabel as Record<string, string>).C;
      binds.optD = (byLabel as Record<string, string>).D;
    }
    if (input.correctAnswer !== undefined) {
      sets.push("CORRECT_ANSWER = :correctAnswer");
      binds.correctAnswer = input.correctAnswer;
    }
    if (input.difficulty !== undefined) {
      sets.push("DIFFICULTY = :difficulty");
      binds.difficulty = input.difficulty;
    }
    if (input.chapter !== undefined) {
      sets.push("CHAPTER = :chapter");
      binds.chapter = input.chapter;
    }
    if (input.point !== undefined) {
      sets.push("POINT = :point");
      binds.point = input.point;
    }
    sets.push("UPDATED_AT = SYSTIMESTAMP");
    if (sets.length === 1) return this.findById(id, { includeAnswer: true });
    await execute(`UPDATE QUESTIONS SET ${sets.join(", ")} WHERE ID = :id`, binds);
    return this.findById(id, { includeAnswer: true });
  },

  async remove(id: number): Promise<boolean> {
    const { rowsAffected } = await execute("DELETE FROM QUESTIONS WHERE ID = :id", { id });
    return rowsAffected > 0;
  },

  async isQuestionInPublishedExam(id: number): Promise<boolean> {
    const { rows } = await execute<{ C: number }>(
      `SELECT COUNT(*) AS C
       FROM EXAM_QUESTIONS eq
       JOIN EXAMS e ON eq.EXAM_ID = e.ID
       WHERE eq.QUESTION_ID = :id AND e.STATUS = 'PUBLISHED'`,
      { id },
    );
    return Number(rows[0]?.C ?? 0) > 0;
  },
};
