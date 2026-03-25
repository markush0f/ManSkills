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
        <div className="flex min-h-full flex-1 flex-col border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.008))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--violet-strong)] shadow-[0_0_12px_rgba(138,108,230,0.4)]" />
              <h1 className="text-[14px] text-[var(--text)]">{title}</h1>
            </div>
            {query.trim().length > 0 && (
              <p className="mt-1 inline-flex items-center gap-2 text-[11px] text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
                Filtered by: {query.trim()}
              </p>
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
