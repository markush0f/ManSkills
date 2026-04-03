import { createContext, useContext, type ReactNode } from "react";

type UiShellContextValue = {
  isUiShellReady: boolean;
};

const UiShellContext = createContext<UiShellContextValue | null>(null);

export function UiShellProvider({ children }: { children: ReactNode }) {
  return (
    <UiShellContext.Provider value={{ isUiShellReady: true }}>
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
