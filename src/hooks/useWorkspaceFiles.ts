import { useMemo, useState } from "react";
import { mergeWorkspaceFiles } from "../ide/systemSkills";
import { buildTree } from "../ide/utils";
import type { IdeFile } from "../types";

export function useWorkspaceFiles() {
  const [files, setFiles] = useState<IdeFile[]>([]);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState("");

  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file] as const)), [files]);
  const activeFile = activeFileId ? fileById.get(activeFileId) ?? null : null;
  const tree = useMemo(() => buildTree(files), [files]);
  const openFiles = useMemo(
    () => openFileIds.map((fileId) => fileById.get(fileId)).filter((file): file is IdeFile => Boolean(file)),
    [fileById, openFileIds],
  );
  const hasUnsavedChanges = useMemo(
    () => files.some((file) => file.content !== file.savedContent),
    [files],
  );

  function openFile(fileId: string) {
    if (!fileById.has(fileId)) {
      return;
    }

    setOpenFileIds((current) => (current.includes(fileId) ? current : [...current, fileId]));
    setActiveFileId(fileId);
  }

  function closeFile(fileId: string) {
    const nextOpen = openFileIds.filter((currentId) => currentId !== fileId);

    setOpenFileIds(nextOpen);

    if (activeFileId === fileId) {
      setActiveFileId(nextOpen[nextOpen.length - 1] ?? "");
    }
  }

  function updateActiveFile(content: string) {
    if (!activeFileId) {
      return;
    }

    setFiles((current) =>
      current.map((file) =>
        file.id === activeFileId
          ? {
              ...file,
              content,
            }
          : file,
      ),
    );
  }

  function mergeFiles(nextFiles: IdeFile[]) {
    setFiles((current) => mergeWorkspaceFiles(current, nextFiles));
  }

  function mergeFilesAndOpen(nextFiles: IdeFile[], targetFileId?: string) {
    mergeFiles(nextFiles);

    if (targetFileId) {
      setOpenFileIds((current) => (current.includes(targetFileId) ? current : [...current, targetFileId]));
      setActiveFileId(targetFileId);
    }
  }

  return {
    activeFile,
    activeFileId,
    closeFile,
    fileById,
    files,
    hasUnsavedChanges,
    mergeFiles,
    mergeFilesAndOpen,
    openFile,
    openFileIds,
    openFiles,
    setActiveFileId,
    tree,
    updateActiveFile,
  };
}
