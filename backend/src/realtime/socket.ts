import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken, type AuthTokenPayload } from "../utils/auth";
import type { ViolationEvent } from "../types/domain";

let io: SocketIOServer | null = null;

export interface InitRealtimeOptions {
  httpServer: HttpServer;
  path?: string;
  corsOrigin: string | string[] | boolean;
}

export function initRealtime(opts: InitRealtimeOptions): SocketIOServer {
  const ioServer = new SocketIOServer(opts.httpServer, {
    path: opts.path ?? "/ws",
    cors: { origin: opts.corsOrigin as never, credentials: true },
  });

  // Strongly type socket.data
  type SocketData = { auth?: AuthTokenPayload };
  type S = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

  ioServer.use((socket, next) => {
    try {
      const s = socket as unknown as S;
      const token =
        (s.handshake.auth?.token as string | undefined) ??
        (s.handshake.query?.token as string | undefined);
      if (!token) {
        return next(new Error("Unauthorized socket"));
      }
      const auth: AuthTokenPayload = verifyToken(token);
      (s.data as SocketData).auth = auth;
      next();
    } catch {
      next(new Error("Unauthorized socket"));
    }
  });

  ioServer.on("connection", (rawSocket) => {
    const socket = rawSocket as unknown as S;
    socket.on("teacher:subscribe", () => {
      const auth = (socket.data as SocketData).auth;
      if (!auth) return;
      const room = teacherRoom(auth.sub);
      socket.join(room);
    });
  });

  io = ioServer;
  return ioServer;
}

export function teacherRoom(teacherId: string): string {
  return `teacher:${teacherId}`;
}

export function emitViolation(event: ViolationEvent, teacherIds: string[] = []): void {
  if (!io) return;
  for (const tid of teacherIds) {
    io.to(teacherRoom(tid)).emit("violation", event);
  }
}

export function closeRealtime(): Promise<void> {
  return new Promise((resolve) => {
    if (!io) return resolve();
    io.close(() => {
      io = null;
      resolve();
    });
  });
}
