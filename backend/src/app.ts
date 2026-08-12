import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { ping } from "./config/database";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { subjectRouter } from "./routes/subject.routes";
import { classRouter } from "./routes/class.routes";
import { questionRouter, teacherImportRouter } from "./routes/question.routes";
import { examRouter } from "./routes/exam.routes";
import { studentRouter } from "./routes/student.routes";
import { reportsRouter } from "./routes/reports.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { asyncHandler } from "./utils/async-handler";
import { ok } from "./utils/response";

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","), credentials: true }));
  app.use(helmet());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  const api = express.Router();
  api.get("/health", asyncHandler(async (_req, res) => {
    const dbUp = await ping();
    res.status(dbUp ? 200 : 503).json({
      success: dbUp,
      data: { status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down" },
    });
  }));

  api.use("/auth", authRouter);
  api.use("/users", userRouter);
  api.use("/subjects", subjectRouter);
  api.use("/classes", classRouter);
  api.use("/questions", questionRouter);
  api.use("/teacher", teacherImportRouter);
  api.use("/exams", examRouter);
  api.use("/student", studentRouter);
  api.use("/reports", reportsRouter);

  api.use(notFound);
  api.use(errorHandler);

  app.use("/api", api);
  app.get("/", (_req, res) => ok(res, { name: "trac-nghiem-backend", status: "up" }, "ok"));

  app.use(errorHandler);
  return app;
}
