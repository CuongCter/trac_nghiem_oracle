import { execute } from "../config/database";
import { examRepo } from "../repositories/exam.repo";
import { attemptRepo, type GradingResult } from "../repositories/attempt.repo";
import { questionRepo } from "../repositories/question.repo";
import { resultRepo } from "../repositories/result.repo";
import { examService } from "./exam.service";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";
import { emitViolation } from "../realtime/socket";
import type { StartExamResponse, ExamResult, ViolationEvent } from "../types/domain";
import type { OptionLabel } from "../constants";

async function pickQuestionsForExam(
  examId: number,
  shuffleQuestions: boolean,
  shuffleOptions: boolean,
): Promise<StartExamResponse["questions"]> {
  const exam = await examRepo.findById(examId);
  if (!exam) throw new NotFoundError("Exam not found");
  const ids = exam.questionIds.map(Number);
  const full = await questionRepo.findByIds(ids, false);
  const byId = new Map(full.map((q) => [Number(q._id), q]));
  let list = ids
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));
  if (shuffleQuestions) {
    list = [...list].sort(() => Math.random() - 0.5);
  }
  if (shuffleOptions) {
    list = list.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
  }
  return list.map((q) => ({
    _id: q._id,
    content: q.content,
    options: q.options.map((o) => ({ label: o.label, text: o.text })),
    point: q.point,
  }));
}

async function gradeAttempt(attemptId: number): Promise<GradingResult> {
  const rows = await attemptRepo.getGradingInputs(attemptId);
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalPointsEarned = 0;
  let totalPointsPossible = 0;
  const answers: GradingResult["answers"] = [];
  for (const r of rows) {
    totalPointsPossible += r.point;
    const isCorrect =
      r.selectedOption !== null && r.selectedOption === r.correctAnswer;
    if (isCorrect) {
      totalCorrect++;
      totalPointsEarned += r.point;
    } else if (r.selectedOption !== null) {
      totalWrong++;
    }
    answers.push({
      questionId: r.questionId,
      selectedOption: r.selectedOption,
      isCorrect,
    });
  }
  const score = attemptRepo.computeScore(totalPointsEarned, totalPointsPossible);
  return {
    totalCorrect,
    totalWrong,
    totalPointsEarned,
    totalPointsPossible,
    score,
    passed: score >= resultRepo.passThreshold(),
    answers,
  };
}

export const studentExamService = {
  async list(studentId: number): Promise<StartExamResponse["questions"][number][]> {
    // Not used directly. Instead, return the underlying exams:
    const exams = await examRepo.listForStudent(studentId);
    return [];
  },

  async availableExams(studentId: number) {
    return examRepo.listForStudent(studentId);
  },

  async startExam(
    examId: number,
    studentId: number,
  ): Promise<StartExamResponse> {
    const { exam } = await examService.canStudentStart(examId, studentId);

    // Check whether an attempt already exists
    const existing = await attemptRepo.findExisting(examId, studentId);
    if (existing) {
      if (existing.status === "IN_PROGRESS") {
        if (existing.studentId !== String(studentId)) {
          throw new ForbiddenError("Bạn không sở hữu attempt này");
        }
        return {
          attemptId: existing._id,
          duration: exam.duration,
          endTime: existing.endTime,
          questions: await pickQuestionsForExam(
            examId,
            exam.shuffleQuestions,
            exam.shuffleOptions,
          ),
        };
      }
      throw new ConflictError("Bạn đã hoàn thành bài thi này");
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + exam.duration * 60 * 1000);
    const questions = exam.questionIds.map(Number);
    const attemptId = await attemptRepo.start({
      examId,
      studentId,
      endTime,
      questions,
    });

    return {
      attemptId: String(attemptId),
      duration: exam.duration,
      endTime: endTime.toISOString(),
      questions: await pickQuestionsForExam(
        examId,
        exam.shuffleQuestions,
        exam.shuffleOptions,
      ),
    };
  },

  async saveAnswer(
    examId: number,
    studentId: number,
    questionId: number,
    selectedOption: OptionLabel,
  ): Promise<void> {
    const attempt = await attemptRepo.findActiveByExamAndStudent(examId, studentId);
    if (!attempt) throw new NotFoundError("Attempt không tồn tại hoặc không phải của bạn");
    if (attempt.studentId !== String(studentId)) {
      throw new ForbiddenError("Bạn không sở hữu attempt này");
    }
    if (attempt.status !== "IN_PROGRESS") throw new BadRequestError("Bài thi đã kết thúc");
    await attemptRepo.saveAnswer(Number(attempt._id), questionId, selectedOption);
  },

  async submitExam(examId: number, studentId: number, isAuto = false): Promise<ExamResult> {
    const attempt = await attemptRepo.findActiveByExamAndStudent(examId, studentId);
    if (!attempt) throw new NotFoundError("Attempt không tồn tại hoặc không phải của bạn");
    if (attempt.studentId !== String(studentId)) {
      throw new ForbiddenError("Bạn không sở hữu attempt này");
    }
    const attemptIdNum = Number(attempt._id);
    const exam = await examRepo.findById(examId);
    if (!exam) throw new NotFoundError("Exam not found");

    const grading = await gradeAttempt(attemptIdNum);
    const resultId = await resultRepo.create({
      examId,
      studentId,
      totalCorrect: grading.totalCorrect,
      totalWrong: grading.totalWrong,
      score: grading.score,
      passed: grading.passed,
      answers: grading.answers,
    });

    const newStatus = isAuto ? "EXPIRED" : "SUBMITTED";
    await attemptRepo.markSubmitted(attemptIdNum, newStatus, isAuto);

    const result = await resultRepo.findById(resultId);
    if (!result) throw new Error("Failed to load result after submission");
    return result;
  },

  async recordViolation(
    examId: number,
    studentId: number,
    type: string,
  ): Promise<void> {
    const attempt = await attemptRepo.findActiveByExamAndStudent(examId, studentId);
    if (!attempt) throw new NotFoundError("Attempt không tồn tại");
    await attemptRepo.recordViolation(Number(attempt._id), type);

    // Push to teachers whose attempts are on this exam
    const teacherIds = await examRepo.findOwnersForExam(examId);
    const studentUser = await import("../repositories/user.repo").then((m) => m.userRepo.findById(studentId));
    const event: ViolationEvent = {
      attemptId: attempt._id,
      examId: String(examId),
      studentId: String(studentId),
      studentName: studentUser?.fullName,
      type,
      ts: Date.now(),
    };
    emitViolation(event, teacherIds);
  },

  async resultsFor(studentId: number): Promise<ExamResult[]> {
    return resultRepo.listForStudent(studentId);
  },

  async resultById(id: number, studentId: number): Promise<ExamResult> {
    const r = await resultRepo.findById(id);
    if (!r) throw new NotFoundError("Result not found");
    if (Number(r.studentId) !== studentId) throw new ForbiddenError("Bạn không sở hữu kết quả này");
    return r;
  },

  /** Periodic task to expire stale attempts. Call from setInterval. */
  async expireStaleAttempts(): Promise<number> {
    const count = await attemptRepo.markExpired();
    if (count === 0) return 0;
    // Auto-grade each expired attempt
    const { rows } = await execute<{ ID: number; STUDENT_ID: number; EXAM_ID: number }>(
      `SELECT ID, STUDENT_ID, EXAM_ID FROM EXAM_ATTEMPTS WHERE STATUS = 'EXPIRED' AND SUBMITTED_AT IS NULL`,
    );
    for (const r of rows) {
      try {
        await this.submitExam(r.EXAM_ID, r.STUDENT_ID, true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[expire-grading] failed", err);
      }
    }
    return count;
  },
};
