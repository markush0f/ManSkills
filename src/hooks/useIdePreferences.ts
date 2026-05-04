import { useCallback, useEffect, useRef, useState } from "react";
import type { IdePreferences } from "../types";

const IDE_PREFERENCES_KEY = "skills-ide:preferences";
const STORAGE_DEBOUNCE_MS = 400;

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
  systemSkillsOnlyGitProjects: false,
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

  const pendingWriteRef = useRef<number | null>(null);
  const lastSerializedRef = useRef<string>(JSON.stringify(preferences));

  useEffect(() => {
    if (pendingWriteRef.current !== null) {
      return;
    }

    pendingWriteRef.current = window.setTimeout(() => {
      pendingWriteRef.current = null;
      const nextSerialized = JSON.stringify(preferences);

      if (nextSerialized === lastSerializedRef.current) {
        return;
      }

      lastSerializedRef.current = nextSerialized;
      window.localStorage.setItem(IDE_PREFERENCES_KEY, nextSerialized);
    }, STORAGE_DEBOUNCE_MS);

    return () => {
      if (pendingWriteRef.current !== null) {
        window.clearTimeout(pendingWriteRef.current);
        pendingWriteRef.current = null;
      }
    };
  }, [preferences]);

  const updatePreferences = useCallback((nextPreferences: Partial<IdePreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...nextPreferences };

      if (next === current) {
        return current;
      }

      return next;
    });
  }, []);

  return {
    preferences,
    updatePreferences,
  };
}
