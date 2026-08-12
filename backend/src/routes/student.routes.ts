import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  startExamSaveAnswerSchema,
  startExamViolationSchema,
} from "../validators/resources";
import { objectIdString } from "../validators/common";
import { asyncHandler } from "../utils/async-handler";
import { studentExamService } from "../services/student-exam.service";
import { ok } from "../utils/response";
import { ROLES } from "../constants";

export const studentRouter = Router();

const idParam = z.object({ id: objectIdString });

studentRouter.use(authenticate);
studentRouter.use(authorize(ROLES.STUDENT));

studentRouter.get(
  "/exams",
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const items = await studentExamService.availableExams(Number(auth.sub));
    ok(res, items);
  }),
);

studentRouter.post(
  "/exams/:id/start",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const auth = req.auth!;
    const result = await studentExamService.startExam(Number(id), Number(auth.sub));
    ok(res, result, "Bắt đầu bài thi");
  }),
);

studentRouter.post(
  "/exams/:id/save-answer",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const data = startExamSaveAnswerSchema.parse(req.body);
    const auth = req.auth!;
    await studentExamService.saveAnswer(
      Number(id),
      Number(auth.sub),
      Number(data.questionId),
      data.selectedOption,
    );
    ok(res, { success: true });
  }),
);

studentRouter.post(
  "/exams/:id/submit",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const auth = req.auth!;
    const result = await studentExamService.submitExam(Number(id), Number(auth.sub), false);
    ok(res, result, "Đã nộp bài");
  }),
);

studentRouter.post(
  "/exams/:id/violation",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const data = startExamViolationSchema.parse(req.body);
    const auth = req.auth!;
    await studentExamService.recordViolation(Number(id), Number(auth.sub), data.type);
    ok(res, { success: true });
  }),
);

studentRouter.get(
  "/results",
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const items = await studentExamService.resultsFor(Number(auth.sub));
    ok(res, items);
  }),
);

studentRouter.get(
  "/results/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const auth = req.auth!;
    const r = await studentExamService.resultById(Number(id), Number(auth.sub));
    ok(res, r);
  }),
);
