import { createContext, useContext, type ReactNode } from "react";
import { useSystemSkills } from "../hooks/useSystemSkills";

type SystemSkillsContextValue = ReturnType<typeof useSystemSkills>;

const SystemSkillsContext = createContext<SystemSkillsContextValue | null>(null);

export function SystemSkillsProvider({ children }: { children: ReactNode }) {
  const value = useSystemSkills();

  return <SystemSkillsContext.Provider value={value}>{children}</SystemSkillsContext.Provider>;
}

export function useSystemSkillsState() {
  const context = useContext(SystemSkillsContext);

  if (!context) {
    throw new Error("useSystemSkillsState must be used within a SystemSkillsProvider");
  }

  return context;
}
