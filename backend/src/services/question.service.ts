import { questionRepo } from "../repositories/question.repo";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import type { Difficulty, OptionLabel, Question, QuestionOption } from "../types/domain";
import type { PaginatedData } from "../types/api";
import { buildPagination } from "../utils/helpers";

export interface QuestionInput {
  subjectId: string;
  content: string;
  options: QuestionOption[];
  correctAnswer: OptionLabel;
  difficulty: Difficulty;
  chapter?: string | null;
  point: number;
}

export const questionService = {
  async list(args: {
    page: number;
    limit: number;
    subjectId?: string;
    difficulty?: Difficulty;
    chapter?: string;
    search?: string;
  }): Promise<PaginatedData<Question>> {
    const subjectIdNum = args.subjectId ? Number(args.subjectId) : undefined;
    const { items, total } = await questionRepo.list({ ...args, subjectId: subjectIdNum });
    return { items, pagination: buildPagination({ page: args.page, limit: args.limit, total }) };
  },

  async getById(id: number): Promise<Question> {
    const q = await questionRepo.findById(id, { includeAnswer: true });
    if (!q) throw new NotFoundError("Question not found");
    return q;
  },

  async create(createdBy: number, input: QuestionInput): Promise<Question> {
    return questionRepo.create({
      subjectId: Number(input.subjectId),
      content: input.content,
      options: input.options,
      correctAnswer: input.correctAnswer,
      difficulty: input.difficulty,
      chapter: input.chapter ?? null,
      point: input.point,
      createdBy,
    });
  },

  async update(id: number, input: Partial<QuestionInput>): Promise<Question> {
    const updated = await questionRepo.update(id, {
      subjectId: input.subjectId !== undefined ? Number(input.subjectId) : undefined,
      content: input.content,
      options: input.options,
      correctAnswer: input.correctAnswer,
      difficulty: input.difficulty,
      chapter: input.chapter,
      point: input.point,
    });
    if (!updated) throw new NotFoundError("Question not found");
    return updated;
  },

  async remove(id: number): Promise<void> {
    if (await questionRepo.isQuestionInPublishedExam(id)) {
      throw new ConflictError("Câu hỏi đang thuộc một đề đã phát hành, không thể xóa");
    }
    const ok = await questionRepo.remove(id);
    if (!ok) throw new NotFoundError("Question not found");
  },

  async importRows(createdBy: number, rows: Array<Record<string, unknown>>): Promise<{ created: number; errors: Array<{ index: number; message: string }> }> {
    const errors: Array<{ index: number; message: string }> = [];
    let created = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const subjectId = Number(r.subjectId);
        if (!Number.isFinite(subjectId)) throw new Error("subjectId không hợp lệ");
        const opts = [
          { label: "A" as const, text: String(r.optionA ?? "").trim() },
          { label: "B" as const, text: String(r.optionB ?? "").trim() },
          { label: "C" as const, text: String(r.optionC ?? "").trim() },
          { label: "D" as const, text: String(r.optionD ?? "").trim() },
        ];
        if (opts.some((o) => !o.text)) throw new Error("Phải có đủ đáp án A, B, C, D không rỗng");
        const correct = String(r.correctAnswer ?? "").toUpperCase();
        if (!["A", "B", "C", "D"].includes(correct)) throw new Error("correctAnswer phải là A/B/C/D");
        const difficulty = String(r.difficulty ?? "").toUpperCase();
        if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) throw new Error("difficulty phải là EASY/MEDIUM/HARD");
        const point = Number(r.point ?? 1);
        if (!Number.isFinite(point) || point <= 0 || point > 100) throw new Error("point phải trong (0, 100]");
        const content = String(r.content ?? "").trim();
        if (!content) throw new Error("content không được rỗng");
        const chapter = r.chapter ? String(r.chapter) : null;

        await questionRepo.create({
          subjectId,
          content,
          options: opts,
          correctAnswer: correct as OptionLabel,
          difficulty: difficulty as Difficulty,
          chapter,
          point,
          createdBy,
        });
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid row";
        errors.push({ index: i, message: msg });
      }
    }
    return { created, errors };
  },

  async findByIds(ids: number[], includeAnswer = false): Promise<Question[]> {
    if (ids.length === 0) {
      throw new BadRequestError("Cần cung cấp questionIds");
    }
    return questionRepo.findByIds(ids, includeAnswer);
  },
};
