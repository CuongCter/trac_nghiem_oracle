import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { classCreateSchema, classUpdateSchema } from "../validators/resources";
import { objectIdString } from "../validators/common";
import { asyncHandler } from "../utils/async-handler";
import { classService } from "../services/class.service";
import { created, noContent, ok } from "../utils/response";
import { ROLES } from "../constants";

export const classRouter = Router();

const idParam = z.object({ id: objectIdString });

classRouter.use(authenticate);

// FE uses ?search=... with raw array; use loose parser
classRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const items = await classService.listAll(search);
    ok(res, items);
  }),
);

classRouter.get(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const c = await classService.findById(Number(id));
    ok(res, c);
  }),
);

classRouter.post(
  "/",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = classCreateSchema.parse(req.body);
    const c = await classService.create(data);
    created(res, c, "Tạo lớp học thành công");
  }),
);

classRouter.put(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const data = classUpdateSchema.parse(req.body);
    const c = await classService.update(Number(id), data);
    ok(res, c, "Cập nhật lớp học thành công");
  }),
);

classRouter.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = idParam.parse(req.params);
    await classService.remove(Number(id));
    noContent(res);
  }),
);
