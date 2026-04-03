import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { useIde } from "../contexts/IdeContext";
import { WorkbenchTabsBar } from "../components/layout/WorkbenchTabsBar";

export function SettingsTabsHeader() {
  const { closeFile, openEditor, openFile, openFiles, openSettings } = useIde();

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
                icon: <GearSixIcon className="h-[18px] w-[18px] text-[var(--accent-strong)]" weight="duotone" />,
                label: "Settings",
              },
            ]}
            fileTabs={openFiles}
            onCloseTab={(tabId) => {
              if (tabId === "__settings__") {
                openEditor();
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
            onClick={openEditor}
            title="Volver"
            type="button"
          >
            <ArrowLeftIcon className="h-4 w-4" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
