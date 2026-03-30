import type { IdePreferences } from "../types";
import { InfoRow, Section } from "./SettingsRows";
import type { UpdatePreferences } from "./settingsTypes";
import { matchesSearch } from "./settingsUtils";
import { SelectSetting } from "./SettingsRows";

type WorkspaceSettingsSectionProps = {
  activeFilePath: string;
  openTabsCount: number;
  preferences: IdePreferences;
  query: string;
  resetSidebarWidth: () => void;
  sidebarWidth: number;
  systemSkillCount: number;
  systemSkillScanMs: number | null;
  updatePreferences: UpdatePreferences;
};

export function hasWorkspaceSettingsResults(
  query: string,
  activeFilePath: string,
  openTabsCount: number,
  systemSkillCount: number,
  systemSkillScanMs: number | null,
) {
  return (
    matchesSearch(query, "Workbench: Save Shortcut", "Atajo de teclado para guardar archivos editables.") ||
    matchesSearch(query, "Workbench: Sidebar Width", "Ancho actual del panel lateral.") ||
    matchesSearch(query, "Workspace: Active File", activeFilePath) ||
    matchesSearch(query, "Workspace: Open Tabs", String(openTabsCount)) ||
    matchesSearch(query, "Workspace: Loaded Skills", String(systemSkillCount)) ||
    matchesSearch(query, "Workspace: Last Scan", formatScanDuration(systemSkillScanMs))
  );
}

function formatScanDuration(systemSkillScanMs: number | null) {
  return systemSkillScanMs === null ? "Sin datos" : `${systemSkillScanMs} ms`;
}

export function WorkspaceSettingsSection({
  activeFilePath,
  openTabsCount,
  preferences,
  query,
  resetSidebarWidth,
  sidebarWidth,
  systemSkillCount,
  systemSkillScanMs,
  updatePreferences,
}: WorkspaceSettingsSectionProps) {
  if (!hasWorkspaceSettingsResults(query, activeFilePath, openTabsCount, systemSkillCount, systemSkillScanMs)) {
    return null;
  }

  const formattedScanDuration = formatScanDuration(systemSkillScanMs);

  return (
    <Section>
      {matchesSearch(query, "Workbench: Save Shortcut", "Atajo de teclado para guardar archivos editables.") && (
        <SelectSetting
          description="Atajo de teclado para guardar archivos editables del backend."
          isFirst
          label="Workbench: Save Shortcut"
          onChange={(value) => updatePreferences({ saveShortcut: value })}
          options={[
            { label: "Ctrl/Cmd + S", value: "mod+s" },
            { label: "Ctrl/Cmd + Shift + S", value: "mod+shift+s" },
            { label: "Alt + S", value: "alt+s" },
          ]}
          value={preferences.saveShortcut}
        />
      )}
      {matchesSearch(query, "Workbench: Sidebar Width", "Ancho actual del panel lateral.") && (
        <div className="grid gap-3 border-t border-[var(--border)] px-4 py-3 xl:grid-cols-[minmax(0,1fr)_180px] xl:items-start">
          <div className="min-w-0">
            <p className="text-[13px] text-[var(--text)]">Workbench: Sidebar Width</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
              Ancho actual del panel lateral. Puedes restaurarlo al valor por defecto.
            </p>
          </div>
          <div className="flex items-center justify-start gap-2 xl:justify-end">
            <span className="text-[12px] text-[var(--muted)]">{sidebarWidth}px</span>
            <button
              className="rounded-[10px] border border-[var(--border)] bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              onClick={resetSidebarWidth}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      {matchesSearch(query, "Workspace: Active File", activeFilePath) && (
        <InfoRow label="Workspace: Active File" value={activeFilePath} />
      )}
      {matchesSearch(query, "Workspace: Open Tabs", String(openTabsCount)) && (
        <InfoRow label="Workspace: Open Tabs" value={String(openTabsCount)} />
      )}
      {matchesSearch(query, "Workspace: Loaded Skills", String(systemSkillCount)) && (
        <InfoRow label="Workspace: Loaded Skills" value={String(systemSkillCount)} />
      )}
      {matchesSearch(query, "Workspace: Last Scan", formattedScanDuration) && (
        <InfoRow label="Workspace: Last Scan" value={formattedScanDuration} />
      )}
    </Section>
  );
}
