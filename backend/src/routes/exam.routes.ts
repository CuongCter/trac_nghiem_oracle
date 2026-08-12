import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  examCreateSchema,
  examListQuery,
} from "../validators/resources";
import { objectIdString } from "../validators/common";
import { asyncHandler } from "../utils/async-handler";
import { examService } from "../services/exam.service";
import { created, noContent, ok } from "../utils/response";
import { ROLES } from "../constants";

export const examRouter = Router();

const idParam = z.object({ id: objectIdString });

examRouter.use(authenticate);

examRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = examListQuery.parse(req.query);
    const auth = req.auth!;
    const createdBy = auth.role === "TEACHER" ? Number(auth.sub) : undefined;
    const data = await examService.list({ ...q, createdBy });
    ok(res, data);
  }),
);

examRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const e = await examService.findById(Number(id));
    ok(res, e);
  }),
);

examRouter.post(
  "/",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = examCreateSchema.parse(req.body);
    const auth = req.auth!;
    const result = await examService.create(Number(auth.sub), data);
    created(res, result, "Tạo đề thi thành công");
  }),
);

examRouter.post(
  "/:id/publish",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const auth = req.auth!;
    await examService.publish(Number(id), Number(auth.sub));
    ok(res, { success: true }, "Đã xuất bản đề thi");
  }),
);

examRouter.post(
  "/:id/close",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const auth = req.auth!;
    await examService.close(Number(id), Number(auth.sub));
    ok(res, { success: true }, "Đã đóng đề thi");
  }),
);

examRouter.delete(
  "/:id",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const auth = req.auth!;
    await examService.remove(Number(id), Number(auth.sub));
    noContent(res);
  }),
);
