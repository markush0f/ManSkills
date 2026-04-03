import { useMemo, useState } from "react";
import { hasCursorSettingsResults } from "../settings/CursorSettingsSection";
import { hasDisplaySettingsResults } from "../settings/DisplaySettingsSection";
import { SETTINGS_CATEGORIES, type SettingsCategory } from "../settings/settingsCategories";
import { hasTextEditorSettingsResults } from "../settings/TextEditorSettingsSection";
import { hasWorkspaceSettingsResults } from "../settings/WorkspaceSettingsSection";

type UseSettingsSearchOptions = {
  activeFilePath: string;
  openTabsCount: number;
  systemSkillCount: number;
  systemSkillScanMs: number | null;
};

export function useSettingsSearch({
  activeFilePath,
  openTabsCount,
  systemSkillCount,
  systemSkillScanMs,
}: UseSettingsSearchOptions) {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>("text");
  const [query, setQuery] = useState("");

  const selectedCategoryLabel = useMemo(
    () => SETTINGS_CATEGORIES.find((category) => category.id === selectedCategory)?.label ?? "Settings",
    [selectedCategory],
  );

  const hasResults = useMemo(() => {
    switch (selectedCategory) {
      case "text":
        return hasTextEditorSettingsResults(query);
      case "cursor":
        return hasCursorSettingsResults(query);
      case "display":
        return hasDisplaySettingsResults(query);
      case "workspace":
        return hasWorkspaceSettingsResults(
          query,
          activeFilePath,
          openTabsCount,
          systemSkillCount,
          systemSkillScanMs,
        );
      default:
        return false;
    }
  }, [activeFilePath, openTabsCount, query, selectedCategory, systemSkillCount, systemSkillScanMs]);

  return {
    hasResults,
    query,
    selectedCategory,
    selectedCategoryLabel,
    setQuery,
    setSelectedCategory,
  };
}
