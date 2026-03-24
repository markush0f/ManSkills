import type { ReactNode } from "react";
import type { IdeFile } from "../../ide/types";
import { getFileName } from "../../ide/utils";

type ExtraTab = {
  badge: string;
  id: string;
  icon?: ReactNode;
  label: string;
};

type WorkbenchTabsBarProps = {
  activeTabId: string;
  extraTabs?: ExtraTab[];
  fileTabs: IdeFile[];
  onCloseTab: (tabId: string) => void;
  onOpenTab: (tabId: string) => void;
};

export function WorkbenchTabsBar({
  activeTabId,
  extraTabs = [],
  fileTabs,
  onCloseTab,
  onOpenTab,
}: WorkbenchTabsBarProps) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto px-2 py-2">
      {fileTabs.map((file) => {
        const isDirty = file.content !== file.savedContent;
        const isActive = file.id === activeTabId;

        return (
          <button
            key={file.id}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] border px-3 text-[13px] transition ${
              isActive
                ? "border-[var(--border)] bg-white/4 text-[var(--text)]"
                : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/[0.03] hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenTab(file.id)}
            type="button"
          >
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
              {file.language}
            </span>
            <span>{getFileName(file.path)}</span>
            {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
            <span
              className="text-[var(--muted)] hover:text-[var(--text)]"
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(file.id);
              }}
            >
              x
            </span>
          </button>
        );
      })}

      {extraTabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <button
            key={tab.id}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] border px-3 text-[13px] transition ${
              isActive
                ? "border-[var(--border)] bg-white/4 text-[var(--text)]"
                : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/[0.03] hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenTab(tab.id)}
            type="button"
          >
            {tab.icon ? (
              <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--muted)]">
                {tab.icon}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                {tab.badge}
              </span>
            )}
            <span>{tab.label}</span>
            <span
              className="text-[var(--muted)] hover:text-[var(--text)]"
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              x
            </span>
          </button>
        );
      })}
    </div>
  );
}
