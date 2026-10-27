"use client";

import { useEffect, useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, errorMessage } from "./api";

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Maps API validation details onto form fields; anything else becomes a toast. */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>) {
  if (err instanceof ApiError && err.details && Object.keys(err.details).length) {
    let mapped = false;
    for (const [field, messages] of Object.entries(err.details)) {
      if (Array.isArray(messages) && messages[0]) {
        setError(field as Path<T>, { message: messages[0] });
        mapped = true;
      }
    }
    if (mapped) return;
  }
  toast.error(errorMessage(err));
}
