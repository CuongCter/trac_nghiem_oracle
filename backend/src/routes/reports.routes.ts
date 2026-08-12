import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";
import { reportsService } from "../services/reports.service";
import { ok } from "../utils/response";
import { ROLES } from "../constants";

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get(
  "/dashboard",
  authorize(ROLES.ADMIN),
  asyncHandler(async (_req, res) => {
    const data = await reportsService.dashboard();
    ok(res, data);
  }),
);

reportsRouter.get(
  "/teacher-dashboard",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const data = await reportsService.teacherDashboard(Number(auth.sub));
    ok(res, data);
  }),
);

reportsRouter.get(
  "/exams",
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const teacherId = auth.role === "TEACHER" ? Number(auth.sub) : undefined;
    const data = await reportsService.examStats(teacherId);
    ok(res, data);
  }),
);

reportsRouter.get(
  "/students",
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const teacherId = auth.role === "TEACHER" ? Number(auth.sub) : undefined;
    const data = await reportsService.studentStats(teacherId);
    ok(res, data);
  }),
);

reportsRouter.get(
  "/classes",
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const teacherId = auth.role === "TEACHER" ? Number(auth.sub) : undefined;
    const data = await reportsService.classStats(teacherId);
    ok(res, data);
  }),
);
