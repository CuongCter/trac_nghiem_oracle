import { subjectRepo } from "../repositories/subject.repo";
import { BadRequestError, NotFoundError } from "../utils/errors";
import type { PaginatedData } from "../types/api";
import type { Subject } from "../types/domain";
import { buildPagination } from "../utils/helpers";

export const subjectService = {
  async list(args: { page: number; limit: number; search?: string }): Promise<PaginatedData<Subject>> {
    const { items, total } = await subjectRepo.list(args);
    return { items, pagination: buildPagination({ ...args, total }) };
  },

  async listAll(): Promise<Subject[]> {
    return subjectRepo.listAll();
  },

  async create(createdBy: number, input: { name: string; code: string; description?: string }): Promise<Subject> {
    if (!input.code.match(/^[A-Z0-9_-]+$/)) {
      throw new BadRequestError("Mã môn học chỉ gồm chữ in hoa, số, _ và -");
    }
    return subjectRepo.create({
      ...input,
      code: input.code.toUpperCase(),
      description: input.description ?? undefined,
      createdBy,
    });
  },

  async update(id: number, input: Partial<{ name: string; code: string; description: string }>): Promise<Subject> {
    const updated = await subjectRepo.update(id, input);
    if (!updated) throw new NotFoundError("Subject not found");
    return updated;
  },

  async remove(id: number): Promise<void> {
    const ok = await subjectRepo.remove(id);
    if (!ok) throw new NotFoundError("Subject not found");
  },

  async findById(id: number): Promise<Subject> {
    const s = await subjectRepo.findById(id);
    if (!s) throw new NotFoundError("Subject not found");
    return s;
  },
};
