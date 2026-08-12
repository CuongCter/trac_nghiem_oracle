import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  questionCreateSchema,
  questionImportSchema,
  questionListQuery,
  questionUpdateSchema,
} from "../validators/resources";
import { objectIdString } from "../validators/common";
import { asyncHandler } from "../utils/async-handler";
import { questionService } from "../services/question.service";
import { created, noContent, ok } from "../utils/response";
import { ROLES } from "../constants";

export const questionRouter = Router();

const idParam = z.object({ id: objectIdString });

questionRouter.use(authenticate);

questionRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = questionListQuery.parse(req.query);
    const data = await questionService.list(q);
    ok(res, data);
  }),
);

questionRouter.post(
  "/",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = questionCreateSchema.parse(req.body);
    const auth = req.auth!;
    const q = await questionService.create(Number(auth.sub), data);
    created(res, { question: q }, "Tạo câu hỏi thành công");
  }),
);

questionRouter.put(
  "/:id",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const data = questionUpdateSchema.parse(req.body);
    const q = await questionService.update(Number(id), data);
    ok(res, { question: q }, "Cập nhật câu hỏi thành công");
  }),
);

questionRouter.delete(
  "/:id",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    await questionService.remove(Number(id));
    noContent(res);
  }),
);

// Bulk import via teacher path (FE uses POST /teacher/questions/import)
export const teacherImportRouter = Router();
teacherImportRouter.use(authenticate);

teacherImportRouter.post(
  "/questions/import",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { rows } = questionImportSchema.parse(req.body);
    const auth = req.auth!;
    const result = await questionService.importRows(Number(auth.sub), rows);
    ok(res, result, `Import ${result.created} câu hỏi, ${result.errors.length} lỗi`);
  }),
);
