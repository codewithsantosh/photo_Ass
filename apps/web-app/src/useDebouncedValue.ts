import { useEffect, useState } from "react";

/**
 * Small local hook, kept in the app rather than the SDK — media-react is
 * deliberately unopinionated about input timing, so debouncing search
 * input is an app-level concern, not an SDK one.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
