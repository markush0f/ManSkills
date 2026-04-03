import type { ReactNode } from "react";
import { ToastViewport } from "../components/shared/ToastViewport";
import { IdeProvider as IdeStateProvider } from "../contexts/IdeContext";
import { IdeLayoutProvider } from "../contexts/IdeLayoutContext";
import { UiShellProvider } from "../contexts/UiShellContext";

export function IdeProvider({ children }: { children: ReactNode }) {
  return (
    <UiShellProvider>
      <IdeLayoutProvider>
        <IdeStateProvider>{children}</IdeStateProvider>
      </IdeLayoutProvider>
      <ToastViewport />
    </UiShellProvider>
  );
}
