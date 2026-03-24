import { InfoRow, Section } from "./SettingsRows";
import { matchesSearch } from "./settingsUtils";

type WorkspaceSettingsSectionProps = {
  activeFilePath: string;
  openTabsCount: number;
  query: string;
  resetSidebarWidth: () => void;
  sidebarWidth: number;
  systemSkillCount: number;
  systemSkillScanMs: number | null;
};

export function hasWorkspaceSettingsResults(
  query: string,
  activeFilePath: string,
  openTabsCount: number,
  systemSkillCount: number,
  systemSkillScanMs: number | null,
) {
  return (
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
  query,
  resetSidebarWidth,
  sidebarWidth,
  systemSkillCount,
  systemSkillScanMs,
}: WorkspaceSettingsSectionProps) {
  if (!hasWorkspaceSettingsResults(query, activeFilePath, openTabsCount, systemSkillCount, systemSkillScanMs)) {
    return null;
  }

  const formattedScanDuration = formatScanDuration(systemSkillScanMs);

  return (
    <Section>
      {matchesSearch(query, "Workbench: Sidebar Width", "Ancho actual del panel lateral.") && (
        <div className="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_180px] xl:items-start">
          <div className="min-w-0">
            <p className="text-[13px] text-[var(--text)]">Workbench: Sidebar Width</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
              Ancho actual del panel lateral. Puedes restaurarlo al valor por defecto.
            </p>
          </div>
          <div className="flex items-center justify-start gap-2 xl:justify-end">
            <span className="text-[12px] text-[var(--muted)]">{sidebarWidth}px</span>
            <button
              className="border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
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
