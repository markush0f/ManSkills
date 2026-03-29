import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import type { IdeFile } from "../types";
import { WorkbenchTabsBar } from "../components/layout/WorkbenchTabsBar";

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
                icon: <GearSixIcon className="h-4 w-4 text-[var(--accent-strong)]" weight="duotone" />,
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
            <ArrowLeftIcon className="h-3.5 w-3.5" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
