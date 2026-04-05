import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { BackendLogSnapshot } from "../types";

export function useBackendLogs() {
  const [logs, setLogs] = useState<BackendLogSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function normalizeError(error: unknown) {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Could not load backend logs.";
  }

  function refresh() {
    setIsLoading(true);
    setError(null);

    return invoke<BackendLogSnapshot>("read_backend_logs")
      .then((nextLogs) => {
        setLogs(nextLogs);
        return nextLogs;
      })
      .catch((error: unknown) => {
        setError(normalizeError(error));
        throw error;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function clear() {
    setIsClearing(true);
    setError(null);

    return invoke("clear_backend_logs")
      .then(() => refresh())
      .catch((error: unknown) => {
        setError(normalizeError(error));
        throw error;
      })
      .finally(() => {
        setIsClearing(false);
      });
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    clear,
    error,
    isClearing,
    isLoading,
    logs,
    refresh,
  };
}
