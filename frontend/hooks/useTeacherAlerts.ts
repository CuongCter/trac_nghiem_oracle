"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/storage";

export interface ViolationEvent {
  attemptId: string;
  examId: string;
  studentId: string;
  studentName?: string;
  type: string;
  ts: number;
}

interface UseTeacherAlertsOptions {
  /** Connect only when enabled. Default true. */
  enabled?: boolean;
  onViolation?: (e: ViolationEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useTeacherAlerts({
  enabled = true,
  onViolation,
  onConnect,
  onDisconnect,
}: UseTeacherAlertsOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [lastViolation, setLastViolation] = useState<ViolationEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const token = getToken();
    if (!token) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
    // strip trailing /api for socket connect
    const url = baseUrl.replace(/\/api\/?$/, "");

    const s = io(url, {
      path: "/ws",
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
    });
    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      s.emit("teacher:subscribe");
      onConnect?.();
    });
    s.on("disconnect", () => {
      setConnected(false);
      onDisconnect?.();
    });
    s.on("violation", (payload: ViolationEvent) => {
      setLastViolation(payload);
      onViolation?.(payload);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [enabled, onViolation, onConnect, onDisconnect]);

  return { connected, lastViolation, disconnect };
}
