import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  subjectListQuery,
  subjectCreateSchema,
  subjectUpdateSchema,
} from "../validators/resources";
import { objectIdString } from "../validators/common";
import { asyncHandler } from "../utils/async-handler";
import { subjectService } from "../services/subject.service";
import { created, noContent, ok } from "../utils/response";
import { ROLES } from "../constants";

export const subjectRouter = Router();

const idParam = z.object({ id: objectIdString });

subjectRouter.use(authenticate);

subjectRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = subjectListQuery.parse(req.query);
    const data = await subjectService.list(q);
    ok(res, data);
  }),
);

subjectRouter.get(
  "/all",
  asyncHandler(async (_req, res) => {
    const items = await subjectService.listAll();
    ok(res, items);
  }),
);

subjectRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const s = await subjectService.findById(Number(id));
    ok(res, s);
  }),
);

subjectRouter.post(
  "/",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = subjectCreateSchema.parse(req.body);
    const auth = req.auth!;
    const s = await subjectService.create(Number(auth.sub), data);
    created(res, { subject: s }, "Tạo môn học thành công");
  }),
);

subjectRouter.put(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const data = subjectUpdateSchema.parse(req.body);
    const s = await subjectService.update(Number(id), data);
    ok(res, { subject: s }, "Cập nhật môn học thành công");
  }),
);

subjectRouter.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    await subjectService.remove(Number(id));
    noContent(res);
  }),
);
