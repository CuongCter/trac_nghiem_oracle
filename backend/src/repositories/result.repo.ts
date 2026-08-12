import { execute, withTransaction } from "../config/database";
import oracledb from "oracledb";
import type { ExamResult, OptionLabel } from "../types/domain";
import { env } from "../config/env";

interface ResultRow {
  ID: number;
  EXAM_ID: number;
  STUDENT_ID: number;
  EXAM_TITLE?: string;
  STUDENT_NAME?: string;
  STUDENT_EMAIL?: string;
  TOTAL_CORRECT: number;
  TOTAL_WRONG: number;
  SCORE: number;
  PASSED: string;
  SUBMITTED_AT: Date;
  GRADED_AT: Date;
}

interface ResultAnswerRow {
  QUESTION_ID: number;
  SELECTED_OPTION: OptionLabel | null;
  IS_CORRECT: string;
}

function boolFlag(v: unknown): boolean {
  if (typeof v === "string") return v === "Y" || v === "1" || v.toUpperCase() === "TRUE";
  if (typeof v === "number") return v === 1;
  return false;
}

function toResult(row: ResultRow, answers: ResultAnswerRow[]): ExamResult {
  return {
    _id: String(row.ID),
    examId: String(row.EXAM_ID),
    studentId: String(row.STUDENT_ID),
    examTitle: row.EXAM_TITLE,
    studentName: row.STUDENT_NAME,
    answers: answers.map((a) => ({
      questionId: String(a.QUESTION_ID),
      selectedOption: a.SELECTED_OPTION,
      isCorrect: boolFlag(a.IS_CORRECT),
    })),
    totalCorrect: Number(row.TOTAL_CORRECT),
    totalWrong: Number(row.TOTAL_WRONG),
    score: Number(row.SCORE),
    passed: boolFlag(row.PASSED),
    submittedAt: row.SUBMITTED_AT.toISOString(),
    gradedAt: row.GRADED_AT.toISOString(),
  };
}

export const resultRepo = {
  async findByAttempt(attemptId: number): Promise<ExamResult | null> {
    const { rows } = await execute<ResultRow>(
      `SELECT r.*, e.TITLE AS EXAM_TITLE, u.FULL_NAME AS STUDENT_NAME, u.EMAIL AS STUDENT_EMAIL
       FROM EXAM_RESULTS r
       JOIN EXAMS e ON r.EXAM_ID = e.ID
       JOIN USERS u ON r.STUDENT_ID = u.ID
       WHERE r.EXAM_ID = (SELECT EXAM_ID FROM EXAM_ATTEMPTS WHERE ID = :aid)
         AND r.STUDENT_ID = (SELECT STUDENT_ID FROM EXAM_ATTEMPTS WHERE ID = :aid2)`,
      { aid: attemptId, aid2: attemptId },
    );
    if (rows.length === 0) return null;
    const id = rows[0].ID;
    const { rows: answerRows } = await execute<ResultAnswerRow>(
      `SELECT ra.QUESTION_ID, ra.SELECTED_OPTION, ra.IS_CORRECT
       FROM RESULT_ANSWERS ra WHERE ra.RESULT_ID = :rid`,
      { rid: id },
    );
    return toResult(rows[0], answerRows);
  },

  async findById(id: number): Promise<ExamResult | null> {
    const { rows } = await execute<ResultRow>(
      `SELECT r.*, e.TITLE AS EXAM_TITLE, u.FULL_NAME AS STUDENT_NAME, u.EMAIL AS STUDENT_EMAIL
       FROM EXAM_RESULTS r
       JOIN EXAMS e ON r.EXAM_ID = e.ID
       JOIN USERS u ON r.STUDENT_ID = u.ID
       WHERE r.ID = :id`,
      { id },
    );
    if (rows.length === 0) return null;
    const { rows: answerRows } = await execute<ResultAnswerRow>(
      `SELECT QUESTION_ID, SELECTED_OPTION, IS_CORRECT FROM RESULT_ANSWERS WHERE RESULT_ID = :rid`,
      { rid: id },
    );
    return toResult(rows[0], answerRows);
  },

  async listForStudent(studentId: number): Promise<ExamResult[]> {
    const { rows } = await execute<ResultRow>(
      `SELECT r.*, e.TITLE AS EXAM_TITLE, u.FULL_NAME AS STUDENT_NAME, u.EMAIL AS STUDENT_EMAIL
       FROM EXAM_RESULTS r
       JOIN EXAMS e ON r.EXAM_ID = e.ID
       JOIN USERS u ON r.STUDENT_ID = u.ID
       WHERE r.STUDENT_ID = :sid
       ORDER BY r.SUBMITTED_AT DESC`,
      { sid: studentId },
    );
    const out: ExamResult[] = [];
    for (const r of rows) {
      const { rows: answerRows } = await execute<ResultAnswerRow>(
        `SELECT QUESTION_ID, SELECTED_OPTION, IS_CORRECT FROM RESULT_ANSWERS WHERE RESULT_ID = :rid`,
        { rid: r.ID },
      );
      out.push(toResult(r, answerRows));
    }
    return out;
  },

  async create(input: {
    examId: number;
    studentId: number;
    totalCorrect: number;
    totalWrong: number;
    score: number;
    passed: boolean;
    answers: Array<{ questionId: number; selectedOption: OptionLabel | null; isCorrect: boolean }>;
  }): Promise<number> {
    return withTransaction(async (conn) => {
      const result = await conn.execute<{ ID: number }>(
        `INSERT INTO EXAM_RESULTS (EXAM_ID, STUDENT_ID, TOTAL_CORRECT, TOTAL_WRONG, SCORE, PASSED)
         VALUES (:eid, :sid, :tc, :tw, :score, :passed)
         RETURNING ID INTO :id`,
        {
          eid: input.examId,
          sid: input.studentId,
          tc: input.totalCorrect,
          tw: input.totalWrong,
          score: input.score,
          passed: input.passed ? "Y" : "N",
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      const resultId = result.outBinds?.id as number;
      for (const a of input.answers) {
        await conn.execute(
          `INSERT INTO RESULT_ANSWERS (RESULT_ID, QUESTION_ID, SELECTED_OPTION, IS_CORRECT)
           VALUES (:rid, :qid, :sel, :correct)`,
          {
            rid: resultId,
            qid: a.questionId,
            sel: a.selectedOption,
            correct: a.isCorrect ? "Y" : "N",
          },
        );
      }
      return resultId;
    });
  },

  passThreshold(): number {
    return env.PASS_SCORE;
  },
};
