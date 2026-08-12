"use client";

import { useEffect, useRef } from "react";

/**
 * Debounce a value over time. Calls the callback when the value
 * stops changing for `delay` ms.
 */
export function useDebouncedEffect<T>(
  value: T,
  effect: (val: T) => void | Promise<void>,
  delay = 500,
) {
  const effectRef = useRef(effect);
  effectRef.current = effect;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      effectRef.current(value);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);
}
