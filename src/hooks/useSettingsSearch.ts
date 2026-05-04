import { useCallback, useMemo, useRef, useState } from "react";
import { useUiShell } from "../contexts/UiShellContext";
import { hasCursorSettingsResults } from "../settings/CursorSettingsSection";
import { hasDisplaySettingsResults } from "../settings/DisplaySettingsSection";
import { hasSkillsSettingsResults } from "../settings/SkillsSettingsSection";
import { SETTINGS_CATEGORIES, type SettingsCategory } from "../settings/settingsCategories";
import { hasTextEditorSettingsResults } from "../settings/TextEditorSettingsSection";
import { hasWorkspaceSettingsResults } from "../settings/WorkspaceSettingsSection";

type UseSettingsSearchOptions = {
  activeFilePath: string;
  openTabsCount: number;
  systemSkillCount: number;
  systemSkillScanMs: number | null;
};

const SETTINGS_QUERY_DEBOUNCE_MS = 400;

export function useSettingsSearch({
  activeFilePath,
  openTabsCount,
  systemSkillCount,
  systemSkillScanMs,
}: UseSettingsSearchOptions) {
  const { uiState, updateUiState } = useUiShell();
  const [selectedCategory, setSelectedCategoryState] = useState<SettingsCategory>(uiState.settings.selectedCategory);
  const [query, setQueryState] = useState(uiState.settings.query);
  const queryPersistRef = useRef<number | null>(null);

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
      case "skills":
        return hasSkillsSettingsResults(query);
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

  const setQuery = useCallback((value: string) => {
    setQueryState(value);

    if (queryPersistRef.current !== null) {
      window.clearTimeout(queryPersistRef.current);
    }

    queryPersistRef.current = window.setTimeout(() => {
      queryPersistRef.current = null;
      updateUiState((current) => {
        if (current.settings.query === value) {
          return current;
        }

        return {
          ...current,
          settings: { ...current.settings, query: value },
        };
      });
    }, SETTINGS_QUERY_DEBOUNCE_MS);
  }, [updateUiState]);

  const setSelectedCategory = useCallback((category: SettingsCategory) => {
    setSelectedCategoryState((current) => {
      if (current === category) {
        return current;
      }

      updateUiState((current) => ({
        ...current,
        settings: { ...current.settings, selectedCategory: category },
      }));

      return category;
    });
  }, [updateUiState]);

  return {
    hasResults,
    query,
    selectedCategory,
    selectedCategoryLabel,
    setQuery,
    setSelectedCategory,
  };
}
