import { createContext, useContext, type ReactNode } from "react";
import { useSkillClassificationSettings } from "../hooks/useSkillClassificationSettings";

type SkillClassificationContextValue = ReturnType<typeof useSkillClassificationSettings>;

const SkillClassificationContext = createContext<SkillClassificationContextValue | null>(null);

export function SkillClassificationProvider({ children }: { children: ReactNode }) {
  const value = useSkillClassificationSettings();

  return <SkillClassificationContext.Provider value={value}>{children}</SkillClassificationContext.Provider>;
}

export function useSkillClassificationState() {
  const context = useContext(SkillClassificationContext);

  if (!context) {
    throw new Error("useSkillClassificationState must be used within a SkillClassificationProvider");
  }

  return context;
}
