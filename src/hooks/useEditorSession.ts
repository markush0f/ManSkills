import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import { matchesSaveShortcut } from "../ide/utils";
import type { IdeFile, SaveShortcut } from "../types";

type ContentView = "preview" | "code" | "split";

type UseEditorSessionOptions = {
  activeFile: IdeFile | null;
  activeFileSaveError: string | null;
  isSavingActiveFile: boolean;
  preferences: {
    saveShortcut: SaveShortcut;
  };
  saveActiveFile: (nextContent?: string) => Promise<unknown>;
  updateActiveFile: (content: string) => void;
};

export function useEditorSession({
  activeFile,
  activeFileSaveError,
  isSavingActiveFile,
  preferences,
  saveActiveFile,
  updateActiveFile,
}: UseEditorSessionOptions) {
  const [contentViewState, setContentViewState] = useState<{ fileId: string; mode: ContentView }>({
    fileId: "",
    mode: "code",
  });
  const [draftState, setDraftState] = useState<{ content: string; fileId: string }>({
    content: "",
    fileId: "",
  });
  const activeEditorFileId = activeFile?.id ?? "";
  const contentView = contentViewState.fileId === activeEditorFileId ? contentViewState.mode : "code";
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
  const saveErrorWidth = activeFileSaveError ? 244 : 0;

  useEffect(() => {
    if (!activeFile) {
      return;
    }

    if (draftContent === activeFile.content) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
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
    saveErrorWidth,
    selectContentView: (mode: ContentView) => setContentViewState({ fileId: activeEditorFileId, mode }),
    setDraftContent: (content: string) =>
      setDraftState({
        content,
        fileId: activeEditorFileId,
      }),
    supportsPreview,
  };
}
