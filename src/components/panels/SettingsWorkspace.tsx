import { useMemo, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { shellPanelClass } from "../shared/ui";
import { CursorSettingsSection, hasCursorSettingsResults } from "../../settings/CursorSettingsSection";
import { DisplaySettingsSection, hasDisplaySettingsResults } from "../../settings/DisplaySettingsSection";
import { SettingsCategoryNav } from "../../settings/SettingsCategoryNav";
import { SettingsContentPanel } from "../../settings/SettingsContentPanel";
import { SettingsTabsHeader } from "../../settings/SettingsTabsHeader";
import { SETTINGS_CATEGORIES, type SettingsCategory } from "../../settings/settingsCategories";
import { countSkills } from "../../settings/settingsUtils";
import { TextEditorSettingsSection, hasTextEditorSettingsResults } from "../../settings/TextEditorSettingsSection";
import { hasWorkspaceSettingsResults, WorkspaceSettingsSection } from "../../settings/WorkspaceSettingsSection";

export function SettingsWorkspace() {
  const {
    activeFileId,
    activeFile,
    closeFile,
    openFiles,
    openFile,
    openSettings,
    preferences,
    systemSkillScanMs,
    systemSkillTree,
    updatePreferences,
  } = useIde();
  const { resetSidebarWidth, sidebarWidth } = useIdeLayout();
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>("text");
  const [query, setQuery] = useState("");
  const systemSkillCount = countSkills(systemSkillTree);

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
          activeFile.path,
          openFiles.length,
          systemSkillCount,
          systemSkillScanMs,
        );
      default:
        return false;
    }
  }, [activeFile.path, openFiles.length, query, selectedCategory, systemSkillCount, systemSkillScanMs]);

  return (
    <section
      className={`${shellPanelClass} min-h-0 min-w-0 overflow-hidden`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <SettingsTabsHeader
          activeFileId={activeFileId}
          closeFile={closeFile}
          openFile={openFile}
          openFiles={openFiles}
          openSettings={openSettings}
        />

        <div className="grid min-h-0 xl:grid-cols-[220px_minmax(0,1fr)]">
          <SettingsCategoryNav
            categories={SETTINGS_CATEGORIES}
            query={query}
            selectedCategory={selectedCategory}
            setQuery={setQuery}
            setSelectedCategory={setSelectedCategory}
          />

          <SettingsContentPanel
            hasResults={hasResults}
            query={query}
            title={selectedCategoryLabel}
          >
            {selectedCategory === "text" && (
              <TextEditorSettingsSection
                preferences={preferences}
                query={query}
                updatePreferences={updatePreferences}
              />
            )}
            {selectedCategory === "cursor" && (
              <CursorSettingsSection
                preferences={preferences}
                query={query}
                updatePreferences={updatePreferences}
              />
            )}
            {selectedCategory === "display" && (
              <DisplaySettingsSection
                preferences={preferences}
                query={query}
                updatePreferences={updatePreferences}
              />
            )}
            {selectedCategory === "workspace" && (
              <WorkspaceSettingsSection
                activeFilePath={activeFile.path}
                openTabsCount={openFiles.length}
                preferences={preferences}
                query={query}
                resetSidebarWidth={resetSidebarWidth}
                sidebarWidth={sidebarWidth}
                systemSkillCount={systemSkillCount}
                systemSkillScanMs={systemSkillScanMs}
                updatePreferences={updatePreferences}
              />
            )}
          </SettingsContentPanel>
        </div>
      </div>
    </section>
  );
}
