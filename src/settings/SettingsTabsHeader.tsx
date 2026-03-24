import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import type { IdeFile } from "../types";
import { WorkbenchTabsBar } from "../components/layout/WorkbenchTabsBar";

addCollection(codiconIcons);

type SettingsTabsHeaderProps = {
  activeFileId: string;
  closeFile: (fileId: string) => void;
  openFile: (fileId: string) => void;
  openFiles: IdeFile[];
  openSettings: () => void;
};

export function SettingsTabsHeader({
  activeFileId,
  closeFile,
  openFile,
  openFiles,
  openSettings,
}: SettingsTabsHeaderProps) {
  return (
    <div className="min-w-0 overflow-hidden border-b border-[var(--border)] bg-[rgba(4,8,12,0.94)]">
      <WorkbenchTabsBar
        activeTabId="__settings__"
        extraTabs={[
          {
            badge: "cfg",
            id: "__settings__",
            icon: <Icon icon="codicon:settings-gear" className="h-4 w-4" />,
            label: "Settings",
          },
        ]}
        fileTabs={openFiles}
        onCloseTab={(tabId) => {
          if (tabId === "__settings__") {
            openFile(activeFileId);
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
  );
}
