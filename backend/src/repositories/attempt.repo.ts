import { execute, withTransaction } from "../config/database";
import oracledb from "oracledb";
import { env } from "../config/env";
import type { AttemptStatus, OptionLabel, ExamAttempt } from "../types/domain";

interface AttemptRow {
  ID: number;
  EXAM_ID: number;
  STUDENT_ID: number;
  STUDENT_NAME?: string | null;
  STUDENT_EMAIL?: string | null;
  STARTED_AT: Date;
  END_TIME: Date;
  SUBMITTED_AT: Date | null;
  STATUS: AttemptStatus;
  IS_AUTO_SUBMITTED: string;
}

interface AttemptAnswerRow {
  ATTEMPT_ID: number;
  QUESTION_ID: number;
  SELECTED_OPTION: OptionLabel | null;
}

function boolFlag(v: unknown): boolean {
  if (typeof v === "string") return v === "Y" || v === "1" || v.toUpperCase() === "TRUE";
  if (typeof v === "number") return v === 1;
  return false;
}

function toAttempt(row: AttemptRow, answers: AttemptAnswerRow[]): ExamAttempt {
  return {
    _id: String(row.ID),
    examId: String(row.EXAM_ID),
    studentId: String(row.STUDENT_ID),
    startedAt: row.STARTED_AT.toISOString(),
    endTime: row.END_TIME.toISOString(),
    submittedAt: row.SUBMITTED_AT ? row.SUBMITTED_AT.toISOString() : null,
    status: row.STATUS,
    isAutoSubmitted: boolFlag(row.IS_AUTO_SUBMITTED),
    answers: answers.map((a) => ({
      questionId: String(a.QUESTION_ID),
      selectedOption: a.SELECTED_OPTION,
    })),
  };
}

export const attemptRepo = {
  async findById(id: number): Promise<ExamAttempt | null> {
    const { rows } = await execute<AttemptRow>(
      `SELECT a.*, u.FULL_NAME AS STUDENT_NAME, u.EMAIL AS STUDENT_EMAIL
       FROM EXAM_ATTEMPTS a JOIN USERS u ON a.STUDENT_ID = u.ID
       WHERE a.ID = :id`,
      { id },
    );
    if (rows.length === 0) return null;
    const { rows: answers } = await execute<AttemptAnswerRow>(
      `SELECT ATTEMPT_ID, QUESTION_ID, SELECTED_OPTION FROM ATTEMPT_ANSWERS WHERE ATTEMPT_ID = :id`,
      { id },
    );
    return toAttempt(rows[0], answers);
  },

  async findActiveByExamAndStudent(examId: number, studentId: number): Promise<ExamAttempt | null> {
    const { rows } = await execute<AttemptRow>(
      `SELECT a.*, u.FULL_NAME AS STUDENT_NAME, u.EMAIL AS STUDENT_EMAIL
       FROM EXAM_ATTEMPTS a JOIN USERS u ON a.STUDENT_ID = u.ID
       WHERE a.EXAM_ID = :eid AND a.STUDENT_ID = :sid AND a.STATUS = 'IN_PROGRESS'`,
      { eid: examId, sid: studentId },
    );
    if (rows.length === 0) return null;
    const { rows: answers } = await execute<AttemptAnswerRow>(
      `SELECT ATTEMPT_ID, QUESTION_ID, SELECTED_OPTION FROM ATTEMPT_ANSWERS WHERE ATTEMPT_ID = :id`,
      { id: rows[0].ID },
    );
    return toAttempt(rows[0], answers);
  },

  async findExisting(examId: number, studentId: number): Promise<ExamAttempt | null> {
    const { rows } = await execute<AttemptRow>(
      `SELECT a.*, u.FULL_NAME AS STUDENT_NAME, u.EMAIL AS STUDENT_EMAIL
       FROM EXAM_ATTEMPTS a JOIN USERS u ON a.STUDENT_ID = u.ID
       WHERE a.EXAM_ID = :eid AND a.STUDENT_ID = :sid`,
      { eid: examId, sid: studentId },
    );
    if (rows.length === 0) return null;
    const { rows: answers } = await execute<AttemptAnswerRow>(
      `SELECT ATTEMPT_ID, QUESTION_ID, SELECTED_OPTION FROM ATTEMPT_ANSWERS WHERE ATTEMPT_ID = :id`,
      { id: rows[0].ID },
    );
    return toAttempt(rows[0], answers);
  },

  async start(input: {
    examId: number;
    studentId: number;
    endTime: Date;
    questions: number[];
  }): Promise<number> {
    return withTransaction(async (conn) => {
      const result = await conn.execute<{ ID: number }>(
        `INSERT INTO EXAM_ATTEMPTS (EXAM_ID, STUDENT_ID, END_TIME, STATUS)
         VALUES (:eid, :sid, :endTime, 'IN_PROGRESS')
         RETURNING ID INTO :id`,
        {
          eid: input.examId,
          sid: input.studentId,
          endTime: input.endTime,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      const attemptId = result.outBinds?.id as number;
      for (const qid of input.questions) {
        await conn.execute(
          `INSERT INTO ATTEMPT_ANSWERS (ATTEMPT_ID, QUESTION_ID, SELECTED_OPTION)
           VALUES (:aid, :qid, NULL)`,
          { aid: attemptId, qid },
        );
      }
      return attemptId;
    });
  },

  async saveAnswer(attemptId: number, questionId: number, selected: OptionLabel): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE ATTEMPT_ANSWERS
         SET SELECTED_OPTION = :selected
         WHERE ATTEMPT_ID = :aid AND QUESTION_ID = :qid`,
        { aid: attemptId, qid: questionId, selected },
      );
    });
  },

  async markSubmitted(
    attemptId: number,
    status: AttemptStatus,
    isAuto: boolean,
  ): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE EXAM_ATTEMPTS
         SET STATUS = :status, IS_AUTO_SUBMITTED = :auto, SUBMITTED_AT = SYSTIMESTAMP
         WHERE ID = :id`,
        { id: attemptId, status, auto: isAuto ? "Y" : "N" },
      );
    });
  },

  async recordViolation(attemptId: number, type: string): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO VIOLATIONS (ATTEMPT_ID, TYPE) VALUES (:aid, :type)`,
        { aid: attemptId, type },
      );
    });
  },

  async listExamsTakingExam(examId: number): Promise<{ id: number; status: AttemptStatus }[]> {
    const { rows } = await execute<{ ID: number; STATUS: AttemptStatus }>(
      `SELECT ID, STATUS FROM EXAM_ATTEMPTS WHERE EXAM_ID = :eid`,
      { eid: examId },
    );
    return rows.map((r) => ({ id: Number(r.ID), status: r.STATUS }));
  },

  async markExpired(): Promise<number> {
    return withTransaction(async (conn) => {
      const res = await conn.execute(
        `UPDATE EXAM_ATTEMPTS SET STATUS = 'EXPIRED', SUBMITTED_AT = SYSTIMESTAMP
         WHERE STATUS = 'IN_PROGRESS' AND END_TIME <= SYSTIMESTAMP`,
      );
      return res.rowsAffected ?? 0;
    });
  },

  async getGradingInputs(
    attemptId: number,
  ): Promise<Array<{ questionId: number; selectedOption: OptionLabel | null; correctAnswer: OptionLabel; point: number; content: string }>> {
    const { rows } = await execute<{
      QUESTION_ID: number;
      SELECTED_OPTION: OptionLabel | null;
      CORRECT_ANSWER: OptionLabel;
      POINT: number;
      CONTENT: string;
    }>(
      `SELECT aa.QUESTION_ID, aa.SELECTED_OPTION, q.CORRECT_ANSWER, q.POINT, q.CONTENT
       FROM ATTEMPT_ANSWERS aa
       JOIN QUESTIONS q ON aa.QUESTION_ID = q.ID
       WHERE aa.ATTEMPT_ID = :aid`,
      { aid: attemptId },
    );
    return rows.map((r) => ({
      questionId: r.QUESTION_ID,
      selectedOption: r.SELECTED_OPTION,
      correctAnswer: r.CORRECT_ANSWER,
      point: Number(r.POINT),
      content: r.CONTENT,
    }));
  },

  /** Compute score using env.SCORE_MAX as the maximum possible score. */
  computeScore(totalPointsEarned: number, totalPointsPossible: number): number {
    if (totalPointsPossible <= 0) return 0;
    const raw = (totalPointsEarned / totalPointsPossible) * env.SCORE_MAX;
    return Math.round(raw * 100) / 100;
  },
};

export interface GradingResult {
  totalCorrect: number;
  totalWrong: number;
  totalPointsEarned: number;
  totalPointsPossible: number;
  score: number;
  passed: boolean;
  answers: Array<{ questionId: number; selectedOption: OptionLabel | null; isCorrect: boolean }>;
}
