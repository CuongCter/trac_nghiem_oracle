import { userRepo } from "../repositories/user.repo";
import { comparePassword, hashPassword, signToken } from "../utils/auth";
import { AppError, BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from "../utils/errors";
import type { Role } from "../constants";
import type { User } from "../types/domain";

export const authService = {
  async login(input: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const record = await userRepo.findByEmail(input.email);
    if (!record) throw new UnauthorizedError("Email hoặc mật khẩu không đúng");
    const ok = await comparePassword(input.password, record.passwordHash);
    if (!ok) throw new UnauthorizedError("Email hoặc mật khẩu không đúng");
    if (record.status === "LOCKED") throw new ForbiddenError("Tài khoản đã bị khóa");

    const token = signToken({ sub: record._id, email: record.email, role: record.role });
    const { passwordHash: _ph, ...user } = record;
    void _ph;
    return { user, token };
  },

  async register(input: {
    fullName: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<{ user: User; token: string }> {
    // Self-registration is restricted to STUDENT only.
    const role: Role = "STUDENT";
    void input.role;
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw new ConflictError("Email đã được đăng ký");
    const passwordHash = await hashPassword(input.password);
    const user = await userRepo.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role,
      status: "ACTIVE",
    });
    const token = signToken({ sub: user._id, email: user.email, role: user.role });
    return { user, token };
  },

  async me(authSub: string): Promise<User> {
    const id = Number(authSub);
    if (!Number.isFinite(id)) throw new UnauthorizedError("Invalid token");
    const u = await userRepo.findById(id);
    if (!u) throw new UnauthorizedError("User not found");
    if (u.status === "LOCKED") throw new ForbiddenError("Tài khoản đã bị khóa");
    return u;
  },

  async changePassword(
    authSub: string,
    input: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const id = Number(authSub);
    if (!Number.isFinite(id)) throw new UnauthorizedError("Invalid token");
    const u = await userRepo.findById(id);
    if (!u) throw new UnauthorizedError("User not found");
    const withHash = await userRepo.findByEmail(u.email);
    if (!withHash) throw new UnauthorizedError("User not found");
    const ok = await comparePassword(input.currentPassword, withHash.passwordHash);
    if (!ok) throw new BadRequestError("Mật khẩu hiện tại không đúng");
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestError("Mật khẩu mới phải khác mật khẩu hiện tại");
    }
    const passwordHash = await hashPassword(input.newPassword);
    await userRepo.update(id, { passwordHash });
  },
};

// Re-export for compatibility
export { AppError };
