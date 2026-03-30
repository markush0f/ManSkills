import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import type { IdeFile } from "../../types";
import { WorkbenchTabsBar } from "../layout/WorkbenchTabsBar";

type MarketplaceTabsHeaderProps = {
  closeFile: (fileId: string) => void;
  openFile: (fileId: string) => void;
  openFiles: IdeFile[];
  openMarketplace: () => void;
  returnToEditor: () => void;
};

export function MarketplaceTabsHeader({
  closeFile,
  openFile,
  openFiles,
  openMarketplace,
  returnToEditor,
}: MarketplaceTabsHeaderProps) {
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
                returnToEditor();
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
            onClick={returnToEditor}
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
