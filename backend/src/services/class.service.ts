import { classRepo } from "../repositories/class.repo";
import { NotFoundError } from "../utils/errors";
import type { ClassEntity } from "../types/domain";
import { userRepo } from "../repositories/user.repo";
import { BadRequestError } from "../utils/errors";

export const classService = {
  async listAll(search?: string): Promise<ClassEntity[]> {
    return classRepo.listAll(search);
  },

  async findById(id: number): Promise<ClassEntity> {
    const c = await classRepo.findById(id);
    if (!c) throw new NotFoundError("Class not found");
    return c;
  },

  async create(input: { name: string; teacherId?: string | null; students: string[] }): Promise<ClassEntity> {
    const teacherId = input.teacherId ? Number(input.teacherId) : null;
    if (teacherId !== null) {
      const t = await userRepo.findById(teacherId);
      if (!t) throw new BadRequestError("Teacher không tồn tại");
      if (t.role !== "TEACHER" && t.role !== "ADMIN") {
        throw new BadRequestError("Người được gán giảng dạy phải có vai trò TEACHER/ADMIN");
      }
    }
    const studentIds = input.students.map(Number);
    return classRepo.create({
      name: input.name,
      teacherId,
      students: studentIds,
    });
  },

  async update(id: number, input: Partial<{ name: string; teacherId: string | null; students: string[] }>): Promise<ClassEntity> {
    const patch: Partial<{ name: string; teacherId: number | null; students: number[] }> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.teacherId !== undefined) patch.teacherId = input.teacherId ? Number(input.teacherId) : null;
    if (input.students !== undefined) patch.students = input.students.map(Number);
    const updated = await classRepo.update(id, patch);
    if (!updated) throw new NotFoundError("Class not found");
    return updated;
  },

  async remove(id: number): Promise<void> {
    const ok = await classRepo.remove(id);
    if (!ok) throw new NotFoundError("Class not found");
  },
};
