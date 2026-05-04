import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { useIde } from "../../contexts/IdeContext";
import { WorkbenchTabsBar } from "../layout/WorkbenchTabsBar";
export function MarketplaceTabsHeader() {
  const { closeFile, openEditor, openFile, openFiles, openMarketplace } = useIde();

  return (
    <div className="h-[var(--app-header-height)] min-w-0 overflow-hidden border-b border-[var(--border)] bg-[image:var(--topbar-bg)] shadow-[var(--topbar-shadow)]">
      <div className="flex h-full min-w-0 items-stretch">
        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkbenchTabsBar
            activeTabId="__marketplace__"
            extraTabs={[
              {
                badge: "mkt",
                id: "__marketplace__",
                icon: <BagSimpleIcon className="h-[18px] w-[18px] text-[var(--cyan-strong)]" weight="duotone" />,
                label: "Marketplace",
              },
            ]}
            fileTabs={openFiles}
            onCloseTab={(tabId) => {
              if (tabId === "__marketplace__") {
                openEditor();
                return;
              }

              closeFile(tabId);
            }}
            onOpenTab={(tabId) => {
              if (tabId === "__marketplace__") {
                openMarketplace();
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
