import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { IdeProvider } from "./providers/IdeProvider";
import { IdeWorkbench } from "./components/layout/IdeWorkbench";

function App() {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let frameId: number | undefined;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        invoke<string>("tauri_greeting")
          .then((message) => {
            if (!cancelled) {
              window.alert(message);
            }
          })
          .catch((error) => {
            console.error("Failed to load Tauri greeting", error);
          });
      }, 120);
    });

    return () => {
      cancelled = true;
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <IdeProvider>
      <IdeWorkbench />
    </IdeProvider>
  );
}

export default App;
