import { useEffect, useState } from "react";
import type { Toast } from "../types";

const DEFAULT_TOAST_DURATION_MS = 3600;

function createToastId() {
  return `toast-${Math.random().toString(36).slice(2, 10)}`;
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const dismissableToasts = toasts.filter((toast) => !toast.sticky);

    if (dismissableToasts.length === 0) {
      return;
    }

    const timeoutIds = dismissableToasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((currentToast) => currentToast.id !== toast.id));
      }, toast.durationMs ?? DEFAULT_TOAST_DURATION_MS),
    );

    return () => {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [toasts]);

  function dismissToast(toastId: string) {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }

  function pushToast(toast: Omit<Toast, "id"> & { id?: string }) {
    const nextToast: Toast = {
      ...toast,
      id: toast.id ?? createToastId(),
    };

    setToasts((current) => [...current, nextToast]);

    return nextToast.id;
  }

  return {
    dismissToast,
    pushToast,
    toasts,
  };
}
