export type PersistedWorkspaceView = "editor" | "settings" | "marketplace";
export type PersistedEditorPreviewMode = "preview" | "code" | "split";
export type PersistedSettingsCategory = "text" | "cursor" | "display" | "workspace";

export type PersistedWorkspaceTab = {
  relativePath: string;
  rootPath: string;
};

export type PersistedUiStateV1 = {
  editor: {
    previewModeByFile: Record<string, PersistedEditorPreviewMode>;
  };
  marketplace: {
    query: string;
  };
  settings: {
    query: string;
    selectedCategory: PersistedSettingsCategory;
  };
  sidebar: {
    expandedSections: {
      providers: boolean;
      systemSkills: boolean;
      workspace: boolean;
    };
    expandedSystemSkillNodeIds: string[];
    searchQuery: string;
  };
  sidebarWidth: number | null;
  version: 1;
  workspace: {
    activeTab: PersistedWorkspaceTab | null;
    openTabs: PersistedWorkspaceTab[];
  };
  workspaceView: PersistedWorkspaceView;
};
