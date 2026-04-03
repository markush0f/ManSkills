import { createContext, useContext, type ReactNode } from "react";
import { useSidebarTree } from "../hooks/useSidebarTree";

type SidebarContextValue = ReturnType<typeof useSidebarTree>;

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const value = useSidebarTree();

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarState() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarProvider");
  }

  return context;
}
