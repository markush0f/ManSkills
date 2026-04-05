import { useBackendLogs } from "../hooks/useBackendLogs";
import { SkeletonBlock } from "../components/shared/SkeletonBlock";
import { ghostButtonClass } from "../components/shared/ui";
import { InfoRow, Section } from "./SettingsRows";
import { matchesSearch } from "./settingsUtils";
import { SelectSetting } from "./SettingsRows";
import { useSettings } from "./SettingsContext";

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
    matchesSearch(query, "Workspace: Backend Logs", "Persistent backend diagnostics and command output.") ||
    matchesSearch(query, "Workspace: Active File", activeFilePath) ||
    matchesSearch(query, "Workspace: Open Tabs", String(openTabsCount)) ||
    matchesSearch(query, "Workspace: Loaded Skills", String(systemSkillCount)) ||
    matchesSearch(query, "Workspace: Last Scan", formatScanDuration(systemSkillScanMs))
  );
}

function formatScanDuration(systemSkillScanMs: number | null) {
  return systemSkillScanMs === null ? "Sin datos" : `${systemSkillScanMs} ms`;
}

export function WorkspaceSettingsSection() {
  const {
    activeFilePath,
    openTabsCount,
    preferences,
    query,
    resetSidebarWidth,
    sidebarWidth,
    systemSkillCount,
    systemSkillScanMs,
    updatePreferences,
  } = useSettings();
  const { clear, error: logsError, isClearing, isLoading: logsLoading, logs, refresh } = useBackendLogs();

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
      {matchesSearch(query, "Workspace: Backend Logs", "Persistent backend diagnostics and command output.") && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--text)]">Workspace: Backend Logs</p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                Persistent backend diagnostics, scan traces, watcher activity, and Tauri command results.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className={ghostButtonClass} onClick={() => void refresh()} type="button">
                Refresh
              </button>
              <button
                className={ghostButtonClass}
                disabled={isClearing}
                onClick={() => void clear()}
                type="button"
              >
                {isClearing ? "Clearing..." : "Clear"}
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-[12px] border border-[var(--border)] bg-black/15 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Log File</p>
            <p className="mt-2 break-all font-mono text-[11px] leading-5 text-[var(--text)]">
              {logs?.path ?? "Resolving backend log path..."}
            </p>
          </div>

          <div className="mt-3 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[#081018]">
            <div className="border-b border-[var(--border)] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Recent Entries
            </div>

            {logsLoading ? (
              <div className="space-y-3 px-3 py-3">
                <SkeletonBlock className="h-3 w-40" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-[88%]" />
                <SkeletonBlock className="h-3 w-[92%]" />
              </div>
            ) : logsError ? (
              <div className="px-3 py-3 text-[12px] leading-5 text-[#ffb3a7]">{logsError}</div>
            ) : logs?.content.trim().length ? (
              <div className="px-3 py-3">
                {logs.truncated ? (
                  <p className="mb-3 text-[11px] text-[var(--muted)]">
                    Showing the tail of the persisted log file.
                  </p>
                ) : null}
                <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-[#c8d4df]">
                  {logs.content}
                </pre>
              </div>
            ) : (
              <div className="px-3 py-3 text-[12px] leading-5 text-[var(--muted)]">
                No backend logs have been written yet.
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
