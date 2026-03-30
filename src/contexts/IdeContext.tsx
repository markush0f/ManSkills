import { createContext, useContext, type ReactNode } from "react";
import { useIdeWorkspace } from "../hooks/useIdeWorkspace";

type IdeContextValue = ReturnType<typeof useIdeWorkspace>;

const IdeContext = createContext<IdeContextValue | null>(null);

export function IdeProvider({ children }: { children: ReactNode }) {
  const value = useIdeWorkspace();

  return <IdeContext.Provider value={value}>{children}</IdeContext.Provider>;
}

export function useIde() {
  const context = useContext(IdeContext);

  if (!context) {
    throw new Error("useIde must be used within an IdeProvider");
  }

  return context;
}
