import { createContext, useContext, type ReactNode } from "react";
import { useIdePreferences } from "../hooks/useIdePreferences";

type PreferencesContextValue = ReturnType<typeof useIdePreferences>;

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const value = useIdePreferences();

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }

  return context;
}
