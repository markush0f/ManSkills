import type { ReactNode } from "react";
import { IdeProvider as IdeStateProvider } from "../contexts/IdeContext";
import { IdeLayoutProvider } from "../contexts/IdeLayoutContext";

export function IdeProvider({ children }: { children: ReactNode }) {
  return (
    <IdeLayoutProvider>
      <IdeStateProvider>{children}</IdeStateProvider>
    </IdeLayoutProvider>
  );
}
