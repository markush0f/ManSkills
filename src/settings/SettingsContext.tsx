import { createContext, useContext, type ReactNode } from "react";
import type { IdePreferences } from "../types";
import type { SettingsCategory } from "./settingsCategories";
import type { UpdatePreferences } from "./settingsTypes";

export type SettingsContextValue = {
  activeFilePath: string;
  hasResults: boolean;
  openTabsCount: number;
  preferences: IdePreferences;
  query: string;
  resetSidebarWidth: () => void;
  selectedCategory: SettingsCategory;
  selectedCategoryLabel: string;
  setQuery: (value: string) => void;
  setSelectedCategory: (category: SettingsCategory) => void;
  sidebarWidth: number;
  systemSkillCount: number;
  systemSkillScanMs: number | null;
  updatePreferences: UpdatePreferences;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: SettingsContextValue;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}
