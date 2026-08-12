import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { loginSchema, registerSchema, changePasswordSchema } from "../validators/auth";
import { asyncHandler } from "../utils/async-handler";
import { authService } from "../services/auth.service";
import { created, noContent, ok } from "../utils/response";
import { ForbiddenError } from "../utils/errors";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    ok(res, result, "Đăng nhập thành công");
  }),
);

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    // Self-register always creates a STUDENT, so force role=STUDENT regardless of payload
    const result = await authService.register({ ...input, role: "STUDENT" });
    created(res, result, "Đăng ký thành công");
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const user = await authService.me(auth.sub);
    ok(res, { user });
  }),
);

authRouter.post(
  "/logout",
  authenticate,
  asyncHandler(async (_req, res) => {
    // Stateless JWT — client should drop the token.
    // Reserved for future token-revocation logic.
    noContent(res);
  }),
);

authRouter.post(
  "/change-password",
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const body = changePasswordSchema.parse(req.body);
    await authService.changePassword(auth.sub, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    ok(res, { success: true }, "Đổi mật khẩu thành công");
  }),
);

// OAuth callback handling — token is expected in query string (?token=...).
authRouter.get(
  "/callback",
  asyncHandler(async (_req, res) => {
    throw new ForbiddenError("OAuth callback chưa được kích hoạt");
  }),
);
