"use client";

import * as React from "react";
import { useEffect } from "react";

interface AntiCheatOptions {
  enabled?: boolean;
  onViolation?: (type: AntiCheatViolation, event: Event) => void;
  /** also trap fullscreen exit; default true */
  fullscreenGuard?: boolean;
}

export type AntiCheatViolation =
  | "copy"
  | "cut"
  | "paste"
  | "contextmenu"
  | "fullscreen-exit"
  | "selectstart";

/**
 * Client-side anti-cheat: blocks copy/paste/contextmenu/selectstart while exam is in progress.
 * Reports violations to the caller (which can log them to the server).
 */
export function useAntiCheat({ enabled = true, onViolation, fullscreenGuard = true }: AntiCheatOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (type: AntiCheatViolation) => (e: Event) => {
      e.preventDefault();
      onViolation?.(type, e);
    };

    const blocks: Array<[string, AntiCheatViolation]> = [
      ["copy", "copy"],
      ["cut", "cut"],
      ["paste", "paste"],
      ["contextmenu", "contextmenu"],
      ["selectstart", "selectstart"],
    ];

    const cleanup: Array<() => void> = [];
    for (const [name, type] of blocks) {
      const fn = handler(type);
      document.addEventListener(name, fn, true);
      cleanup.push(() => document.removeEventListener(name, fn, true));
    }

    const fsHandler = () => {
      if (!fullscreenGuard) return;
      if (document.fullscreenElement == null) {
        onViolation?.("fullscreen-exit", new Event("fullscreen-exit"));
      }
    };
    if (fullscreenGuard) {
      document.addEventListener("fullscreenchange", fsHandler);
      cleanup.push(() => document.removeEventListener("fullscreenchange", fsHandler));
    }

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, [enabled, onViolation, fullscreenGuard]);
}

export async function requestFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (document.fullscreenElement) return true;
  try {
    await document.documentElement.requestFullscreen?.();
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen?.();
    } catch {
      /* noop */
    }
  }
}
