import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import type { ReactNode } from "react";
import type { IdeFile } from "../../types";
import { getFileName } from "../../ide/utils";

addCollection(codiconIcons);

function CloseTabIcon() {
  return (
    <Icon icon="codicon:close" className="h-3.5 w-3.5" />
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
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto px-2 py-1.5">
      {fileTabs.map((file) => {
        const isDirty = file.content !== file.savedContent;
        const isActive = file.id === activeTabId;

        return (
          <button
            key={file.id}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[8px] border px-3 text-[13px] transition ${
              isActive
                ? "border-[var(--violet-border)] bg-[linear-gradient(180deg,rgba(138,108,230,0.16),rgba(255,255,255,0.03))] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenTab(file.id)}
            type="button"
          >
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
              {file.language}
            </span>
            <span className="text-[14px]">{getFileName(file.path)}</span>
            {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(217,98,59,0.5)]" />}
            <span
              className="hover:cursor-pointer inline-flex h-4 w-4 items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
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
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] border px-3 text-[13px] transition ${
              isActive
                ? "border-[var(--violet-border)] bg-[linear-gradient(180deg,rgba(138,108,230,0.16),rgba(255,255,255,0.03))] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenTab(tab.id)}
            type="button"
          >
            {tab.icon ? (
              <span className={`inline-flex h-4 w-4 items-center justify-center ${isActive ? "text-[var(--violet-strong)]" : "text-[var(--muted)]"}`}>
                {tab.icon}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                {tab.badge}
              </span>
            )}
            <span>{tab.label}</span>
            <span
              className="inline-flex h-4 w-4 items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
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
