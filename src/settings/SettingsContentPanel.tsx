import type { ReactNode } from "react";

type SettingsContentPanelProps = {
  children: ReactNode;
  hasResults: boolean;
  query: string;
  title: string;
};

export function SettingsContentPanel({
  children,
  hasResults,
  query,
  title,
}: SettingsContentPanelProps) {
  return (
    <div className="min-h-0 overflow-auto bg-[rgba(4,8,12,0.98)]">
      <div className="flex min-h-full flex-col px-4 py-4">
        <div className="flex min-h-full flex-1 flex-col border border-[var(--border)] bg-white/[0.015]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h1 className="text-[14px] text-[var(--text)]">{title}</h1>
            {query.trim().length > 0 && (
              <p className="mt-1 text-[11px] text-[var(--muted)]">Filtered by: {query.trim()}</p>
            )}
          </div>

          {hasResults ? (
            children
          ) : (
            <div className="px-4 py-6 text-[12px] text-[var(--muted)]">
              No settings match the current search.
            </div>
          )}

          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
