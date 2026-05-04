import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { useSettingsSearch } from "../../hooks/useSettingsSearch";
import { shellPanelClass } from "../shared/ui";
import { SettingsCategoryNav } from "../../settings/SettingsCategoryNav";
import { SettingsContentPanel } from "../../settings/SettingsContentPanel";
import { SettingsProvider } from "../../settings/SettingsContext";
import { SettingsTabsHeader } from "../../settings/SettingsTabsHeader";
import { countSkills } from "../../settings/settingsUtils";

export function SettingsWorkspace() {
  const {
    activeFile,
    openFiles,
    preferences,
    refreshSkillClassificationSettings,
    saveSkillClassificationSettings,
    skillClassificationSettings,
    skillClassificationSettingsError,
    skillClassificationSettingsLoading,
    systemSkillScanMs,
    systemSkillTree,
    updatePreferences,
  } = useIde();
  const { resetSidebarWidth, sidebarWidth } = useIdeLayout();
  const systemSkillCount = countSkills(systemSkillTree);
  const activeFilePath = activeFile?.path ?? "No file selected";
  const {
    hasResults,
    query,
    selectedCategory,
    selectedCategoryLabel,
    setQuery,
    setSelectedCategory,
  } = useSettingsSearch({
    activeFilePath,
    openTabsCount: openFiles.length,
    systemSkillCount,
    systemSkillScanMs,
  });

  const settingsContextValue = {
    activeFilePath,
    hasResults,
    openTabsCount: openFiles.length,
    preferences,
    query,
    resetSidebarWidth,
    refreshSkillClassificationSettings,
    saveSkillClassificationSettings,
    selectedCategory,
    selectedCategoryLabel,
    setQuery,
    setSelectedCategory,
    sidebarWidth,
    skillClassificationSettings,
    skillClassificationSettingsError,
    skillClassificationSettingsLoading,
    systemSkillCount,
    systemSkillScanMs,
    updatePreferences,
  };

  return (
    <SettingsProvider value={settingsContextValue}>
      <section
        className={`${shellPanelClass} h-full min-h-0 min-w-0 overflow-hidden bg-[image:var(--settings-shell-bg)]`}
        style={{
          fontFamily: "var(--font-soft)",
          ["--control-focus-border" as string]: "rgba(239, 142, 73, 0.34)",
          ["--control-focus-bg" as string]: "rgba(217, 98, 59, 0.1)",
          ["--control-focus-icon" as string]: "var(--accent-strong)",
          ["--control-checked-border" as string]: "var(--accent)",
          ["--control-checked-bg" as string]: "var(--accent)",
          ["--control-checked-text" as string]: "#fff8ef",
        }}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[radial-gradient(circle_at_top_right,rgba(217,98,59,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(79,168,199,0.07),transparent_28%)]">
          <SettingsTabsHeader />

          <div className="grid h-full min-h-0 xl:grid-cols-[220px_minmax(0,1fr)]">
            <SettingsCategoryNav />
            <SettingsContentPanel />
          </div>
        </div>
      </section>
    </SettingsProvider>
  );
}
