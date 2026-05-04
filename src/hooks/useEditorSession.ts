import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import { useUiShell } from "../contexts/UiShellContext";
import { matchesSaveShortcut } from "../ide/utils";
import type { IdeFile, SaveShortcut } from "../types";

type ContentView = "preview" | "code" | "split";

type UseEditorSessionOptions = {
  activeFile: IdeFile | null;
  isSavingActiveFile: boolean;
  preferences: {
    saveShortcut: SaveShortcut;
  };
  saveActiveFile: (nextContent?: string) => Promise<unknown>;
  updateActiveFile: (content: string) => void;
};

export function useEditorSession({
  activeFile,
  isSavingActiveFile,
  preferences,
  saveActiveFile,
  updateActiveFile,
}: UseEditorSessionOptions) {
  const { uiState, updateUiState } = useUiShell();
  const [contentViewState, setContentViewState] = useState<{ fileId: string; mode: ContentView }>({
    fileId: "",
    mode: "code",
  });
  const [draftState, setDraftState] = useState<{ content: string; fileId: string }>({
    content: "",
    fileId: "",
  });
  const activeEditorFileId = activeFile?.id ?? "";
  const previewModeStorageKey = activeFile?.rootPath && activeFile.relativePath
    ? `${activeFile.rootPath}:${activeFile.relativePath}`
    : activeFile?.path ?? "";
  const persistedContentView = previewModeStorageKey
    ? uiState.editor.previewModeByFile[previewModeStorageKey]
    : undefined;
  const contentView =
    contentViewState.fileId === activeEditorFileId ? contentViewState.mode : persistedContentView ?? "code";
  const draftContent =
    draftState.fileId === activeEditorFileId ? draftState.content : activeFile?.content ?? "";
  const isMarkdown = activeFile?.language === "md";
  const isJson = activeFile?.language === "json";
  const supportsPreview = isMarkdown || isJson;
  const deferredContent = useDeferredValue(draftContent);
  const canSaveActiveFile = activeFile
    ? Boolean(activeFile.isWritable && activeFile.rootPath && activeFile.relativePath) &&
      activeFile.content !== activeFile.savedContent
    : false;
  const previewRailWidth = supportsPreview ? 126 : 0;
  const saveStatusWidth = isSavingActiveFile ? 148 : 0;

  useEffect(() => {
    if (!activeFile) {
      return;
    }

    if (draftContent === activeFile.content) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (draftContent === activeFile.content) {
        return;
      }

      updateActiveFile(draftContent);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeFile, draftContent, updateActiveFile]);

  const handleWindowSaveShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || !canSaveActiveFile || isSavingActiveFile) {
      return;
    }

    if (!matchesSaveShortcut(event, preferences.saveShortcut)) {
      return;
    }

    event.preventDefault();
    void saveActiveFile(draftContent);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      handleWindowSaveShortcut(event);
    };

    window.addEventListener("keydown", listener, { capture: true });

    return () => {
      window.removeEventListener("keydown", listener, { capture: true });
    };
  }, [handleWindowSaveShortcut]);

  return {
    canSaveActiveFile,
    contentView,
    deferredContent,
    draftContent,
    isMarkdown,
    previewRailWidth,
    saveStatusWidth,
    selectContentView: (mode: ContentView) => {
      setContentViewState({ fileId: activeEditorFileId, mode });

      if (!previewModeStorageKey) {
        return;
      }

      updateUiState((current) => ({
        ...current,
        editor: {
          ...current.editor,
          previewModeByFile: {
            ...current.editor.previewModeByFile,
            [previewModeStorageKey]: mode,
          },
        },
      }));
    },
    setDraftContent: (content: string) =>
      setDraftState({
        content,
        fileId: activeEditorFileId,
      }),
    supportsPreview,
  };
}
