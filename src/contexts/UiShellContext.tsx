import { createContext, useContext, type ReactNode } from "react";
import { usePersistentUiState } from "../hooks/usePersistentUiState";
import type { PersistedUiStateV1 } from "../types";

type UiShellContextValue = {
  isUiShellReady: boolean;
  resetUiState: () => void;
  uiState: PersistedUiStateV1;
  updateUiState: (updater: (current: PersistedUiStateV1) => PersistedUiStateV1) => void;
};

const UiShellContext = createContext<UiShellContextValue | null>(null);

export function UiShellProvider({ children }: { children: ReactNode }) {
  const { resetUiState, uiState, updateUiState } = usePersistentUiState();

  return (
    <UiShellContext.Provider
      value={{
        isUiShellReady: true,
        resetUiState,
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
