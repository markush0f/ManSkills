import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import type { IdeFile } from "../types";
import { WorkbenchTabsBar } from "../components/layout/WorkbenchTabsBar";

addCollection(codiconIcons);

type SettingsTabsHeaderProps = {
  closeFile: (fileId: string) => void;
  openFile: (fileId: string) => void;
  openFiles: IdeFile[];
  openSettings: () => void;
  returnToEditor: () => void;
};

export function SettingsTabsHeader({
  closeFile,
  openFile,
  openFiles,
  openSettings,
  returnToEditor,
}: SettingsTabsHeaderProps) {
  return (
    <div className="h-[var(--app-header-height)] min-w-0 overflow-hidden border-b border-[var(--border)] bg-[image:var(--topbar-bg)] shadow-[var(--topbar-shadow)]">
      <div className="flex h-full min-w-0 items-stretch">
        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkbenchTabsBar
            activeTabId="__settings__"
            extraTabs={[
              {
                badge: "cfg",
                id: "__settings__",
                icon: <Icon icon="codicon:settings-gear" className="h-4 w-4 text-[var(--accent-strong)]" />,
                label: "Settings",
              },
            ]}
            fileTabs={openFiles}
            onCloseTab={(tabId) => {
              if (tabId === "__settings__") {
                returnToEditor();
                return;
              }

              closeFile(tabId);
            }}
            onOpenTab={(tabId) => {
              if (tabId === "__settings__") {
                openSettings();
                return;
              }

              openFile(tabId);
            }}
          />
        </div>

        <div className="flex shrink-0 items-center border-l border-[var(--border)] px-2">
          <button
            aria-label="Volver al editor"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border)] bg-white/[0.02] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            onClick={returnToEditor}
            title="Volver"
            type="button"
          >
            <Icon icon="codicon:arrow-left" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
