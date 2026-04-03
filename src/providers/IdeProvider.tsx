import type { ReactNode } from "react";
import { ToastViewport } from "../components/shared/ToastViewport";
import { IdeProvider as IdeStateProvider } from "../contexts/IdeContext";
import { IdeLayoutProvider } from "../contexts/IdeLayoutContext";
import { MarketplaceStateProvider } from "../contexts/MarketplaceStateContext";
import { PreferencesProvider } from "../contexts/PreferencesContext";
import { SystemSkillsProvider } from "../contexts/SystemSkillsContext";
import { UiShellProvider } from "../contexts/UiShellContext";
import { WorkspaceStateProvider } from "../contexts/WorkspaceStateContext";

export function IdeProvider({ children }: { children: ReactNode }) {
  return (
    <UiShellProvider>
      <PreferencesProvider>
        <WorkspaceStateProvider>
          <SystemSkillsProvider>
            <MarketplaceStateProvider>
              <IdeLayoutProvider>
                <IdeStateProvider>{children}</IdeStateProvider>
              </IdeLayoutProvider>
            </MarketplaceStateProvider>
          </SystemSkillsProvider>
        </WorkspaceStateProvider>
      </PreferencesProvider>
      <ToastViewport />
    </UiShellProvider>
  );
}
