import { createContext, useContext, type ReactNode } from "react";
import { useSidebarResize } from "../hooks/useSidebarResize";

type IdeLayoutContextValue = ReturnType<typeof useSidebarResize>;

const IdeLayoutContext = createContext<IdeLayoutContextValue | null>(null);

export function IdeLayoutProvider({ children }: { children: ReactNode }) {
  const value = useSidebarResize();

  return <IdeLayoutContext.Provider value={value}>{children}</IdeLayoutContext.Provider>;
}

export function useIdeLayout() {
  const context = useContext(IdeLayoutContext);

  if (!context) {
    throw new Error("useIdeLayout must be used within an IdeLayoutProvider");
  }

  return context;
}
