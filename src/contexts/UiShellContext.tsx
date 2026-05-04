import { createContext, useContext, type ReactNode } from "react";
import { usePersistentUiState } from "../hooks/usePersistentUiState";
import { useToastQueue } from "../hooks/useToastQueue";
import type { PersistedUiStateV1, Toast } from "../types";

type UiShellContextValue = {
  dismissToast: (toastId: string) => void;
  isUiShellReady: boolean;
  pushToast: (toast: Omit<Toast, "id"> & { id?: string }) => string;
  resetUiState: () => void;
  toasts: Toast[];
  uiState: PersistedUiStateV1;
  updateUiState: (updater: (current: PersistedUiStateV1) => PersistedUiStateV1) => void;
};

const UiShellContext = createContext<UiShellContextValue | null>(null);

export function UiShellProvider({ children }: { children: ReactNode }) {
  const { resetUiState, uiState, updateUiState } = usePersistentUiState();
  const { dismissToast, pushToast, toasts } = useToastQueue();

  return (
    <UiShellContext.Provider
      value={{
        dismissToast,
        isUiShellReady: true,
        pushToast,
        resetUiState,
        toasts,
        uiState,
        updateUiState,
      }}
    >
      {children}
    </UiShellContext.Provider>
  );
}

export function useUiShell() {
  const context = useContext(UiShellContext);

  if (!context) {
    throw new Error("useUiShell must be used within a UiShellProvider");
  }

  return context;
}
