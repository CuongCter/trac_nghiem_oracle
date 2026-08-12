import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { initPool, closePool } from "./config/database";
import { initRealtime, closeRealtime } from "./realtime/socket";
import { attemptRepo } from "./repositories/attempt.repo";
import { studentExamService } from "./services/student-exam.service";

async function main() {
  await initPool();
  const app = createApp();
  const server = http.createServer(app);
  initRealtime({
    httpServer: server,
    corsOrigin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
  });

  // Periodically expire stale attempts
  const interval = setInterval(() => {
    studentExamService.expireStaleAttempts().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[expire-attempts]", err);
    });
  }, 30_000);
  interval.unref();

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[backend] received ${signal}, shutting down...`);
    clearInterval(interval);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRealtime();
    await closePool();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  void attemptRepo; // ensure tree-shake doesn't drop
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[backend] failed to start:", err);
  process.exit(1);
});
