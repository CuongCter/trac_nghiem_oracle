import { userRepo } from "../repositories/user.repo";
import { hashPassword } from "../utils/auth";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import type { Role, UserStatus } from "../constants";
import type { PaginatedData, Pagination } from "../types/api";
import type { User } from "../types/domain";
import { buildPagination } from "../utils/helpers";

export interface ListUsersArgs {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
}

export const userService = {
  async list(args: ListUsersArgs): Promise<PaginatedData<User>> {
    const { items, total } = await userRepo.list(args);
    const pagination: Pagination = buildPagination({ page: args.page, limit: args.limit, total });
    return { items, pagination };
  },

  async listAll(role?: Role): Promise<User[]> {
    const { items } = await userRepo.list({ page: 1, limit: 200, ...(role ? { role } : {}) });
    return items;
  },

  async create(input: {
    fullName: string;
    email: string;
    password?: string;
    role: Role;
    status?: UserStatus;
  }): Promise<User> {
    if (!input.password) throw new BadRequestError("Password is required");
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw new ConflictError("Email đã được đăng ký");
    const passwordHash = await hashPassword(input.password);
    return userRepo.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
      status: input.status ?? "ACTIVE",
    });
  },

  async update(
    id: number,
    input: {
      fullName?: string;
      email?: string;
      password?: string;
      role?: Role;
      status?: UserStatus;
    },
  ): Promise<User> {
    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.fullName = input.fullName;
    if (input.email !== undefined) patch.email = input.email;
    if (input.password) patch.passwordHash = await hashPassword(input.password);
    if (input.role !== undefined) patch.role = input.role;
    if (input.status !== undefined) patch.status = input.status;
    const updated = await userRepo.update(id, patch);
    if (!updated) throw new NotFoundError("User not found");
    return updated;
  },

  async setStatus(id: number, status: UserStatus): Promise<User> {
    const updated = await userRepo.update(id, { status });
    if (!updated) throw new NotFoundError("User not found");
    return updated;
  },

  async remove(id: number): Promise<boolean> {
    const ok = await userRepo.remove(id);
    if (!ok) throw new NotFoundError("User not found");
    return true;
  },

  async getById(id: number): Promise<User> {
    const u = await userRepo.findById(id);
    if (!u) throw new NotFoundError("User not found");
    return u;
  },
};
