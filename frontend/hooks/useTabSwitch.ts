"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MAX_TAB_SWITCH } from "@/lib/constants";

interface UseTabSwitchResult {
  count: number;
  remaining: number;
  isAtMax: boolean;
  reset: () => void;
}

/**
 * Tracks how many times the user has switched away from the tab.
 * Calls `onMax` exactly once when MAX_TAB_SWITCH is reached.
 */
export function useTabSwitch(onMax?: () => void): UseTabSwitchResult {
  const [count, setCount] = useState(0);
  const firedRef = useRef(false);
  const onMaxRef = useRef(onMax);
  onMaxRef.current = onMax;

  useEffect(() => {
    const handler = () => {
      if (document.hidden && !firedRef.current) {
        setCount((c) => {
          const next = c + 1;
          if (next >= MAX_TAB_SWITCH && !firedRef.current) {
            firedRef.current = true;
            onMaxRef.current?.();
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const reset = useCallback(() => {
    firedRef.current = false;
    setCount(0);
  }, []);

  return {
    count,
    remaining: Math.max(0, MAX_TAB_SWITCH - count),
    isAtMax: count >= MAX_TAB_SWITCH,
    reset,
  };
}
