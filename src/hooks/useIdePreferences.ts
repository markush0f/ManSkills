import { useEffect, useState } from "react";
import type { IdePreferences } from "../types";

const IDE_PREFERENCES_KEY = "skills-ide:preferences";

export const DEFAULT_IDE_PREFERENCES: IdePreferences = {
  bracketPairGuides: true,
  cursorAnimation: true,
  cursorStyle: "line-thin",
  fontLigatures: true,
  fontSize: 14,
  highlightActiveLine: false,
  lineHeight: 28,
  lineNumbers: "on",
  marketplaceInstallCollection: "",
  marketplaceInstallTarget: "codex",
  markdownWordWrap: true,
  minimap: false,
  renderWhitespace: "selection",
  saveShortcut: "mod+s",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  tabSize: 4,
};

export function useIdePreferences() {
  const [preferences, setPreferences] = useState<IdePreferences>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_IDE_PREFERENCES;
    }

    try {
      const storedValue = window.localStorage.getItem(IDE_PREFERENCES_KEY);

      if (!storedValue) {
        return DEFAULT_IDE_PREFERENCES;
      }

      return {
        ...DEFAULT_IDE_PREFERENCES,
        ...(JSON.parse(storedValue) as Partial<IdePreferences>),
      };
    } catch {
      return DEFAULT_IDE_PREFERENCES;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(IDE_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  function updatePreferences(nextPreferences: Partial<IdePreferences>) {
    setPreferences((current) => ({
      ...current,
      ...nextPreferences,
    }));
  }

  return {
    preferences,
    updatePreferences,
  };
}
