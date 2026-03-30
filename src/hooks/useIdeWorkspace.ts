import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  buildSystemSkillFiles,
  getSystemSkillFileId,
  getSystemSkillMainFileId,
} from "../ide/systemSkills";
import { useSkillMarketplace } from "./useSkillMarketplace";
import { useIdePreferences } from "./useIdePreferences";
import { useSystemSkills } from "./useSystemSkills";
import { useWorkspaceFiles } from "./useWorkspaceFiles";
import type { SystemSkill, SystemSkillWatchEvent } from "../types";

export type WorkspaceView = "editor" | "settings" | "marketplace";

const SKILLS_CHANGED_EVENT = "skills:changed";
const WATCH_REFRESH_DEBOUNCE_MS = 350;

function matchesChangedPath(rootPath: string, changedPaths: string[]) {
  return changedPaths.some((path) => path === rootPath || path.startsWith(`${rootPath}/`));
}

export function useIdeWorkspace() {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("editor");
  const [isSavingActiveFile, setIsSavingActiveFile] = useState(false);
  const [activeFileSaveError, setActiveFileSaveError] = useState<string | null>(null);
  const { preferences, updatePreferences } = useIdePreferences();
  const marketplaceState = useSkillMarketplace();
  const workspaceFiles = useWorkspaceFiles();
  const systemSkillsState = useSystemSkills();
  const pendingWatchPathsRef = useRef<Set<string>>(new Set());

  const {
    activeFile,
    activeFileId,
    closeFile,
    fileById,
    files,
    hasUnsavedChanges,
    mergeFiles,
    mergeFilesAndOpen,
    openFile: openWorkspaceFile,
    openFiles,
    tree,
    updateActiveFile,
  } = workspaceFiles;
  const {
    clearSystemSkillActionError,
    listSystemSkillFiles,
    listedSystemSkillIds,
    listingSystemSkillIds,
    loadSystemSkillFiles,
    openingSystemSkillIds,
    refreshSystemSkillTree,
    systemSkillActionError,
    systemSkillByRootPath,
    systemSkillScanMs,
    systemSkillTree,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
  } = systemSkillsState;
  const {
    marketplaceError,
    marketplaceHasSearched,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    refreshMarketplace,
    searchMarketplace,
  } = marketplaceState;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const baseTitle = "Skills IDE";
    document.title = hasUnsavedChanges ? `* ${baseTitle}` : baseTitle;
  }, [hasUnsavedChanges]);

  const refreshAffectedSystemSkills = useEffectEvent(async (changedPaths: string[]) => {
    const loadedRootPaths = new Set(
      files
        .map((file) => file.rootPath)
        .filter((rootPath): rootPath is string => Boolean(rootPath)),
    );

    const affectedSkills = systemSkills.filter((skill) => {
      if (changedPaths.length > 0 && !matchesChangedPath(skill.rootPath, changedPaths)) {
        return false;
      }

      return loadedRootPaths.has(skill.rootPath) || listedSystemSkillIds.has(skill.id);
    });

    await Promise.all(
      affectedSkills.map(async (skill) => {
        if (loadedRootPaths.has(skill.rootPath)) {
          const response = await loadSystemSkillFiles(skill);
          mergeFiles(buildSystemSkillFiles(skill, response));
          return;
        }

        await listSystemSkillFiles(skill, { force: true });
      }),
    );
  });

  const handleWatchedSkillsChange = useEffectEvent((event: SystemSkillWatchEvent) => {
    for (const path of event.paths) {
      pendingWatchPathsRef.current.add(path);
    }

    const nextTimeoutId = window.setTimeout(() => {
      const changedPaths = [...pendingWatchPathsRef.current];
      pendingWatchPathsRef.current.clear();

      refreshSystemSkillTree()
        .then(() => refreshAffectedSystemSkills(changedPaths))
        .catch(() => undefined);
    }, WATCH_REFRESH_DEBOUNCE_MS);

    return nextTimeoutId;
  });

  useEffect(() => {
    let cancelled = false;
    let unlisten = () => {};
    let timeoutId: number | null = null;

    listen<SystemSkillWatchEvent>(SKILLS_CHANGED_EVENT, (event) => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = handleWatchedSkillsChange(event.payload);
    }).then((dispose) => {
      if (cancelled) {
        dispose();
        return;
      }

      unlisten = dispose;
    });

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      unlisten();
    };
  }, []);

  function openEditor() {
    setActiveFileSaveError(null);
    setWorkspaceView("editor");
  }

  function openSettings() {
    setWorkspaceView("settings");
  }

  function openMarketplace() {
    setActiveFileSaveError(null);
    setWorkspaceView("marketplace");
  }

  function openFile(fileId: string) {
    setActiveFileSaveError(null);
    openWorkspaceFile(fileId);
    setWorkspaceView("editor");
  }

  function openSystemSkill(skill: SystemSkill) {
    openSystemSkillFile(skill, "SKILL.md");
  }

  function openSystemSkillFile(skill: SystemSkill, relativePath: string) {
    const targetFileId = getSystemSkillFileId(skill, relativePath);
    const existingFile = fileById.get(targetFileId);

    if (existingFile) {
      openFile(existingFile.id);
      return;
    }

    loadSystemSkillFiles(skill)
      .then((response) => {
        const createdFiles = buildSystemSkillFiles(skill, response);
        const nextFileId =
          createdFiles.find((file) => file.id === targetFileId)?.id ??
          createdFiles.find((file) => file.id === getSystemSkillMainFileId(skill))?.id ??
          createdFiles[0]?.id;

        mergeFilesAndOpen(createdFiles, nextFileId);
        setWorkspaceView("editor");
      })
      .catch(() => undefined);
  }

  function saveActiveFile(nextContent?: string) {
    if (!activeFile?.isWritable || !activeFile.rootPath || !activeFile.relativePath) {
      return Promise.resolve();
    }

    const activeSkill = systemSkillByRootPath.get(activeFile.rootPath);
    const fileToSave = activeFile;
    const contentToSave = nextContent ?? fileToSave.content;

    setIsSavingActiveFile(true);
    setActiveFileSaveError(null);

    return invoke("save_system_skill_file", {
      rootPath: fileToSave.rootPath,
      relativePath: fileToSave.relativePath,
      content: contentToSave,
    })
      .then(() => {
        mergeFiles([
          {
            ...fileToSave,
            content: contentToSave,
            savedContent: contentToSave,
          },
        ]);

        if (!activeSkill) {
          return;
        }

        return loadSystemSkillFiles(activeSkill)
          .then((response) => {
            mergeFiles(buildSystemSkillFiles(activeSkill, response));
            return refreshSystemSkillTree();
          })
          .catch(() => {
            setActiveFileSaveError("Archivo guardado, pero no se pudo refrescar la skill.");
          });
      })
      .catch(() => {
        setActiveFileSaveError("No se pudo guardar el archivo.");
      })
      .finally(() => {
        setIsSavingActiveFile(false);
      });
  }

  return {
    activeFile,
    activeFileId,
    activeFileSaveError,
    clearSystemSkillActionError,
    closeFile,
    files,
    isSavingActiveFile,
    isMarketplaceView: workspaceView === "marketplace",
    isSettingsView: workspaceView === "settings",
    listSystemSkillFiles,
    listedSystemSkillIds,
    listingSystemSkillIds,
    marketplaceError,
    marketplaceHasSearched,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    openEditor,
    openFile,
    openFiles,
    openMarketplace,
    openSettings,
    openSystemSkill,
    openSystemSkillFile,
    openingSystemSkillIds,
    preferences,
    refreshMarketplace,
    searchMarketplace,
    refreshSystemSkillTree,
    saveActiveFile,
    systemSkillActionError,
    systemSkillScanMs,
    systemSkillTree,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
    tree,
    updateActiveFile,
    updatePreferences,
    workspaceView,
  };
}
