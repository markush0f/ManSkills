import { useMemo, useState } from "react";
import { useUiShell } from "../contexts/UiShellContext";
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
  const { uiState, updateUiState } = useUiShell();
  const [selectedCategory, setSelectedCategoryState] = useState<SettingsCategory>(uiState.settings.selectedCategory);
  const [query, setQueryState] = useState(uiState.settings.query);

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

  function setQuery(value: string) {
    setQueryState(value);
    updateUiState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        query: value,
      },
    }));
  }

  function setSelectedCategory(category: SettingsCategory) {
    setSelectedCategoryState(category);
    updateUiState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        selectedCategory: category,
      },
    }));
  }

  return {
    hasResults,
    query,
    selectedCategory,
    selectedCategoryLabel,
    setQuery,
    setSelectedCategory,
  };
}
