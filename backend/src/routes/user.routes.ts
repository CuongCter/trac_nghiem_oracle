import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  userIdParam,
  userListQuery,
  userCreateSchema,
  userUpdateSchema,
} from "../validators/resources";
import { asyncHandler } from "../utils/async-handler";
import { userService } from "../services/user.service";
import { created, noContent, ok } from "../utils/response";
import { ROLES } from "../constants";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  asyncHandler(async (req, res) => {
    const q = userListQuery.parse(req.query);
    const data = await userService.list(q);
    ok(res, data);
  }),
);

userRouter.get(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = userIdParam.parse(req.params);
    const u = await userService.getById(Number(id));
    ok(res, { user: u });
  }),
);

userRouter.post(
  "/",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = userCreateSchema.parse(req.body);
    const u = await userService.create({
      ...data,
      password: data.password || undefined,
    });
    created(res, { user: u }, "Tạo người dùng thành công");
  }),
);

userRouter.put(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = userIdParam.parse(req.params);
    const data = userUpdateSchema.parse(req.body);
    const u = await userService.update(Number(id), data);
    ok(res, { user: u }, "Cập nhật người dùng thành công");
  }),
);

userRouter.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = userIdParam.parse(req.params);
    await userService.remove(Number(id));
    noContent(res);
  }),
);
