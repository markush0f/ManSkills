import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import type { ReactNode } from "react";
import type { IdeFile } from "../../types";
import { getFileName } from "../../ide/utils";

function CloseTabIcon() {
  return (
    <XIcon className="h-4 w-4" weight="bold" />
  );
}

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
    <div className="flex h-full min-w-0 items-stretch overflow-x-auto">
      {fileTabs.map((file) => {
        const isDirty = file.content !== file.savedContent;
        const isActive = file.id === activeTabId;

        return (
          <button
            key={file.id}
            className={`group relative inline-flex h-full shrink-0 items-center gap-2 border-r border-[var(--border)] px-3.5 text-[12px] transition-colors ${
              isActive
                ? "bg-white/[0.03] text-[var(--text)]"
                : "bg-transparent text-[var(--muted)] hover:bg-white/[0.015] hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenTab(file.id)}
            type="button"
          >
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--accent)]" />
            )}
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              {file.language}
            </span>
            <span className={`${isActive ? "text-[var(--text)]" : ""} text-[13px]`}>
              {getFileName(file.path)}
            </span>
            {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
            <span
              className={`inline-flex h-[18px] w-[18px] items-center justify-center transition-opacity ${
                isActive
                  ? "text-[var(--muted)] hover:text-[var(--text)]"
                  : "text-[var(--muted)] opacity-0 hover:text-[var(--text)] group-hover:opacity-100"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(file.id);
              }}
            >
              <CloseTabIcon />
            </span>
          </button>
        );
      })}

      {extraTabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <button
            key={tab.id}
            className={`group relative inline-flex h-full shrink-0 items-center gap-2 border-r border-[var(--border)] px-3.5 text-[12px] transition-colors ${
              isActive
                ? "bg-white/[0.03] text-[var(--text)]"
                : "bg-transparent text-[var(--muted)] hover:bg-white/[0.015] hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenTab(tab.id)}
            type="button"
          >
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--accent)]" />
            )}
            {tab.icon ? (
              <span className={`inline-flex h-[18px] w-[18px] items-center justify-center ${isActive ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>
                {tab.icon}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {tab.badge}
              </span>
            )}
            <span>{tab.label}</span>
            <span
              className={`inline-flex h-[18px] w-[18px] items-center justify-center transition-opacity ${
                isActive
                  ? "text-[var(--muted)] hover:text-[var(--text)]"
                  : "text-[var(--muted)] opacity-0 hover:text-[var(--text)] group-hover:opacity-100"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              <CloseTabIcon />
            </span>
          </button>
        );
      })}
    </div>
  );
}
