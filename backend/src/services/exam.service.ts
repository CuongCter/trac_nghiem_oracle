import { examRepo } from "../repositories/exam.repo";
import { questionRepo } from "../repositories/question.repo";
import { classRepo } from "../repositories/class.repo";
import { subjectRepo } from "../repositories/subject.repo";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";
import type { Exam, ExamStatus } from "../types/domain";
import type { PaginatedData } from "../types/api";
import { buildPagination } from "../utils/helpers";

export interface ExamCreateInput {
  title: string;
  subjectId: string;
  questionIds?: string[];
  randomConfig?: { easy: number; medium: number; hard: number };
  duration: number;
  startTime: string;
  endTime: string;
  assignedClassIds: string[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export const examService = {
  async list(args: {
    page: number;
    limit: number;
    search?: string;
    status?: ExamStatus;
    subjectId?: string;
    createdBy?: number;
  }): Promise<PaginatedData<Exam>> {
    const { items, total } = await examRepo.list({
      page: args.page,
      limit: args.limit,
      search: args.search,
      status: args.status,
      subjectId: args.subjectId ? Number(args.subjectId) : undefined,
      createdBy: args.createdBy,
    });
    return { items, pagination: buildPagination({ page: args.page, limit: args.limit, total }) };
  },

  async findById(id: number): Promise<Exam> {
    const e = await examRepo.findById(id);
    if (!e) throw new NotFoundError("Exam not found");
    return e;
  },

  async create(createdBy: number, input: ExamCreateInput): Promise<{ _id: string }> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestError("startTime/endTime không hợp lệ");
    }
    if (endTime <= startTime) {
      throw new BadRequestError("endTime phải sau startTime");
    }
    const subjectId = Number(input.subjectId);
    const subj = await subjectRepo.findById(subjectId);
    if (!subj) throw new BadRequestError("Môn học không tồn tại");

    let chosenQuestions: { questionId: number; point: number; correctAnswer: string; content: string }[] = [];
    if (input.questionIds && input.questionIds.length > 0) {
      const ids = input.questionIds.map(Number);
      const qs = await questionRepo.findByIds(ids, true);
      // preserve order from input
      const byId = new Map(qs.map((q) => [Number(q._id), q]));
      for (const id of ids) {
        const q = byId.get(id);
        if (!q) throw new BadRequestError(`Question ${id} không tồn tại`);
        if (Number(String(q.subjectId)) !== subjectId) {
          throw new BadRequestError(`Question ${id} không thuộc môn học đã chọn`);
        }
        chosenQuestions.push({
          questionId: Number(q._id),
          point: q.point,
          correctAnswer: (q as unknown as { correctAnswer: string }).correctAnswer,
          content: q.content,
        });
      }
    } else if (input.randomConfig) {
      // Pick random questions by difficulty
      const needed = (["EASY", "MEDIUM", "HARD"] as const).map((d) => ({
        d,
        n: input.randomConfig![d === "EASY" ? "easy" : d === "MEDIUM" ? "medium" : "hard"],
      }));
      for (const { d, n } of needed) {
        if (n <= 0) continue;
        const pool = await questionRepo.list({ page: 1, limit: Math.max(n * 2, 20), subjectId, difficulty: d });
        if (pool.items.length < n) {
          throw new BadRequestError(`Không đủ câu hỏi ${d} (cần ${n}, có ${pool.items.length})`);
        }
        // Shuffle and pick n
        const picked = [...pool.items].sort(() => Math.random() - 0.5).slice(0, n);
        for (const q of picked) {
          chosenQuestions.push({
            questionId: Number(q._id),
            point: q.point,
            correctAnswer: "",
            content: q.content,
          });
        }
      }
      chosenQuestions = chosenQuestions
        .sort(() => Math.random() - 0.5);
    } else {
      throw new BadRequestError("Cần cung cấp questionIds hoặc randomConfig");
    }

    // Pull full question info with answers for point totals
    if (input.questionIds && input.questionIds.length > 0) {
      const ids = chosenQuestions.map((c) => c.questionId);
      const full = await questionRepo.findByIds(ids, true);
      chosenQuestions = full.map((q) => ({
        questionId: Number(q._id),
        point: q.point,
        correctAnswer: (q as unknown as { correctAnswer: string }).correctAnswer,
        content: q.content,
      }));
    } else {
      const ids = chosenQuestions.map((c) => c.questionId);
      const full = await questionRepo.findByIds(ids, true);
      const byId = new Map(full.map((q) => [Number(q._id), q]));
      chosenQuestions = chosenQuestions.map((c) => {
        const q = byId.get(c.questionId);
        return {
          questionId: c.questionId,
          point: q?.point ?? c.point,
          correctAnswer: q ? (q as unknown as { correctAnswer: string }).correctAnswer : "",
          content: q?.content ?? c.content,
        };
      });
    }

    const id = await examRepo.create({
      title: input.title,
      subjectId,
      durationMinutes: input.duration,
      startTime,
      endTime,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
      createdBy,
      questions: chosenQuestions,
      assignedClassIds: input.assignedClassIds.map(Number),
    });
    return { _id: String(id) };
  },

  async publish(id: number, callerId: number): Promise<void> {
    const e = await this.findById(id);
    if (callerId && Number(String(e.createdBy)) !== callerId) {
      throw new ForbiddenError("Bạn không có quyền xuất bản đề thi này");
    }
    if (e.status !== "DRAFT") throw new BadRequestError("Chỉ xuất bản được khi đề ở trạng thái DRAFT");
    await examRepo.setStatus(id, "PUBLISHED");
  },

  async close(id: number, callerId: number): Promise<void> {
    const e = await this.findById(id);
    if (callerId && Number(String(e.createdBy)) !== callerId) {
      throw new ForbiddenError("Bạn không có quyền đóng đề thi này");
    }
    if (e.status !== "PUBLISHED") throw new BadRequestError("Chỉ đóng được đề đang PUBLISHED");
    await examRepo.setStatus(id, "CLOSED");
  },

  async remove(id: number, callerId: number): Promise<void> {
    const e = await this.findById(id);
    if (callerId && Number(String(e.createdBy)) !== callerId) {
      throw new ForbiddenError("Bạn không có quyền xóa đề thi này");
    }
    if (e.status !== "DRAFT") throw new ConflictError("Chỉ xóa được đề ở trạng thái DRAFT");
    await examRepo.remove(id);
  },

  async studentList(studentId: number): Promise<Exam[]> {
    return examRepo.listForStudent(studentId);
  },

  /** Check that the student belongs to one of the assigned classes. */
  async canStudentStart(examId: number, studentId: number): Promise<{ exam: Exam; classIds: number[] }> {
    const exam = await this.findById(examId);
    const assignedClassIds = (Array.isArray(exam.assignedClassIds)
      ? exam.assignedClassIds.map((c) => (typeof c === "string" ? Number(c) : Number((c as { _id: string })._id)))
      : []) as number[];
    if (assignedClassIds.length === 0) throw new ForbiddenError("Bạn không có quyền truy cập đề thi này");
    const ok = await classRepo.isStudentInAnyClass(studentId, assignedClassIds);
    if (!ok) throw new ForbiddenError("Bạn không thuộc lớp được gán đề thi");
    if (exam.status !== "PUBLISHED") throw new BadRequestError("Đề thi chưa được mở");
    const now = new Date();
    if (now < new Date(exam.startTime)) throw new BadRequestError("Đề thi chưa bắt đầu");
    if (now > new Date(exam.endTime)) throw new BadRequestError("Đề thi đã kết thúc");
    return { exam, classIds: assignedClassIds };
  },
};
