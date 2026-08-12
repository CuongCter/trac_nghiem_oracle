"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Generic countdown hook.
 * Counts down to a target timestamp (ms since epoch).
 * Calls `onExpire` exactly once when remaining hits 0.
 */
export function useCountdown(target: number | null, onExpire?: () => void) {
  const [remaining, setRemaining] = useState<number>(() =>
    target ? Math.max(0, target - Date.now()) : 0,
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }
    firedRef.current = false;
    setRemaining(Math.max(0, target - Date.now()));

    const tick = () => {
      const r = Math.max(0, target - Date.now());
      setRemaining(r);
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
        clearInterval(handle);
      }
    };

    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [target]);

  const reset = useCallback(() => {
    if (target) {
      firedRef.current = false;
      setRemaining(Math.max(0, target - Date.now()));
    }
  }, [target]);

  return { remaining, reset };
}
