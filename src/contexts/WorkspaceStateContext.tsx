import { createContext, useContext, type ReactNode } from "react";
import { useWorkspaceFiles } from "../hooks/useWorkspaceFiles";

type WorkspaceStateContextValue = ReturnType<typeof useWorkspaceFiles>;

const WorkspaceStateContext = createContext<WorkspaceStateContextValue | null>(null);

export function WorkspaceStateProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceFiles();

  return <WorkspaceStateContext.Provider value={value}>{children}</WorkspaceStateContext.Provider>;
}

export function useWorkspaceState() {
  const context = useContext(WorkspaceStateContext);

  if (!context) {
    throw new Error("useWorkspaceState must be used within a WorkspaceStateProvider");
  }

  return context;
}
