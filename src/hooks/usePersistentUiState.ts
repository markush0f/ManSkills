import { useEffect, useState } from "react";
import type { PersistedUiStateV1 } from "../types";

export const PERSISTED_UI_STATE_KEY = "skills-ide:ui-state:v1";

export const DEFAULT_PERSISTED_UI_STATE: PersistedUiStateV1 = {
  editor: {
    previewModeByFile: {},
  },
  marketplace: {
    query: "",
  },
  settings: {
    query: "",
    selectedCategory: "text",
  },
  sidebar: {
    expandedSections: {
      systemSkills: true,
      workspace: true,
    },
    expandedSystemSkillNodeIds: [],
    searchQuery: "",
  },
  sidebarWidth: null,
  version: 1,
  workspace: {
    activeTab: null,
    openTabs: [],
  },
  workspaceView: "editor",
};

function normalizePersistedUiState(value: unknown): PersistedUiStateV1 {
  if (!value || typeof value !== "object") {
    return DEFAULT_PERSISTED_UI_STATE;
  }

  const parsed = value as Partial<PersistedUiStateV1>;

  return {
    ...DEFAULT_PERSISTED_UI_STATE,
    ...parsed,
    editor: {
      ...DEFAULT_PERSISTED_UI_STATE.editor,
      ...parsed.editor,
    },
    marketplace: {
      ...DEFAULT_PERSISTED_UI_STATE.marketplace,
      ...parsed.marketplace,
    },
    settings: {
      ...DEFAULT_PERSISTED_UI_STATE.settings,
      ...parsed.settings,
    },
    sidebar: {
      ...DEFAULT_PERSISTED_UI_STATE.sidebar,
      ...parsed.sidebar,
      expandedSections: {
        ...DEFAULT_PERSISTED_UI_STATE.sidebar.expandedSections,
        ...parsed.sidebar?.expandedSections,
      },
    },
    workspace: {
      ...DEFAULT_PERSISTED_UI_STATE.workspace,
      ...parsed.workspace,
    },
    version: 1,
  };
}

export function usePersistentUiState() {
  const [uiState, setUiState] = useState<PersistedUiStateV1>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PERSISTED_UI_STATE;
    }

    try {
      const storedValue = window.localStorage.getItem(PERSISTED_UI_STATE_KEY);

      if (!storedValue) {
        return DEFAULT_PERSISTED_UI_STATE;
      }

      return normalizePersistedUiState(JSON.parse(storedValue));
    } catch {
      return DEFAULT_PERSISTED_UI_STATE;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(PERSISTED_UI_STATE_KEY, JSON.stringify(uiState));
  }, [uiState]);

  function updateUiState(updater: (current: PersistedUiStateV1) => PersistedUiStateV1) {
    setUiState((current) => normalizePersistedUiState(updater(current)));
  }

  return {
    resetUiState: () => setUiState(DEFAULT_PERSISTED_UI_STATE),
    uiState,
    updateUiState,
  };
}
