import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useUiShell } from "../contexts/UiShellContext";
import { useMarketplaceState } from "../contexts/MarketplaceStateContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSystemSkillsState } from "../contexts/SystemSkillsContext";
import { useWorkspaceState } from "../contexts/WorkspaceStateContext";
import {
  buildSystemSkillFiles,
  getSystemSkillFileId,
  getSystemSkillMainFileId,
} from "../ide/systemSkills";
import type {
  MarketplaceInstallResult,
  MarketplaceSkill,
  MarketplaceUninstallResult,
  SystemSkill,
  SystemSkillWatchEvent,
} from "../types";

export type WorkspaceView = "editor" | "settings" | "marketplace";

const SKILLS_CHANGED_EVENT = "skills:changed";
const WATCH_REFRESH_DEBOUNCE_MS = 350;

function matchesChangedPath(rootPath: string, changedPaths: string[]) {
  return changedPaths.some((path) => path === rootPath || path.startsWith(`${rootPath}/`));
}

function parseMarketplaceTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  const date = Number.isNaN(seconds) ? new Date(value) : new Date(seconds * 1000);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

export function useIdeWorkspace() {
  const { pushToast, uiState, updateUiState } = useUiShell();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(uiState.workspaceView);
  const [isSavingActiveFile, setIsSavingActiveFile] = useState(false);
  const [activeFileSaveError, setActiveFileSaveError] = useState<string | null>(null);
  const [selectedMarketplaceSkill, setSelectedMarketplaceSkill] = useState<MarketplaceSkill | null>(null);
  const [installingMarketplaceSkillIds, setInstallingMarketplaceSkillIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [updatingMarketplaceSkillIds, setUpdatingMarketplaceSkillIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [uninstallingMarketplaceSkillIds, setUninstallingMarketplaceSkillIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [marketplaceInstallMessage, setMarketplaceInstallMessage] = useState<string | null>(null);
  const [marketplaceInstallError, setMarketplaceInstallError] = useState<string | null>(null);
  const { preferences, updatePreferences } = usePreferences();
  const marketplaceState = useMarketplaceState();
  const workspaceFiles = useWorkspaceState();
  const systemSkillsState = useSystemSkillsState();
  const pendingWatchPathsRef = useRef<Set<string>>(new Set());
  const hasRestoredWorkspaceSessionRef = useRef(false);

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
    openFileIds,
    openFiles,
    setActiveFileId,
    setOpenFileIds,
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

  useEffect(() => {
    updateUiState((current) => {
      const nextOpenTabs = openFiles
        .filter((file): file is typeof file & { relativePath: string; rootPath: string } => Boolean(file.rootPath && file.relativePath))
        .map((file) => ({
          relativePath: file.relativePath,
          rootPath: file.rootPath,
        }));
      const nextActiveTab =
        activeFile?.rootPath && activeFile.relativePath
          ? {
              relativePath: activeFile.relativePath,
              rootPath: activeFile.rootPath,
            }
          : null;

      const hasSameOpenTabs =
        current.workspace.openTabs.length === nextOpenTabs.length &&
        current.workspace.openTabs.every((tab, index) => {
          const nextTab = nextOpenTabs[index];
          return tab.relativePath === nextTab?.relativePath && tab.rootPath === nextTab?.rootPath;
        });
      const hasSameActiveTab =
        current.workspace.activeTab?.relativePath === nextActiveTab?.relativePath &&
        current.workspace.activeTab?.rootPath === nextActiveTab?.rootPath;

      if (hasSameOpenTabs && hasSameActiveTab) {
        return current;
      }

      return {
        ...current,
        workspace: {
          activeTab: nextActiveTab,
          openTabs: nextOpenTabs,
        },
      };
    });
  }, [activeFile, openFiles, updateUiState]);

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

  useEffect(() => {
    let cancelled = false;

    if (hasRestoredWorkspaceSessionRef.current || systemSkillsLoading) {
      return;
    }

    hasRestoredWorkspaceSessionRef.current = true;

    if (openFileIds.length > 0 || uiState.workspace.openTabs.length === 0) {
      return;
    }

    void Promise.all(
      uiState.workspace.openTabs.map(async (tab) => {
        const skill = systemSkillByRootPath.get(tab.rootPath);
        if (!skill) {
          return null;
        }

        const response = await loadSystemSkillFiles(skill);
        const createdFiles = buildSystemSkillFiles(skill, response);
        const targetFileId =
          createdFiles.find((file) => file.relativePath === tab.relativePath)?.id ??
          createdFiles.find((file) => file.id === getSystemSkillMainFileId(skill))?.id ??
          createdFiles[0]?.id;

        return {
          files: createdFiles,
          targetFileId,
          tab,
        };
      }),
    )
      .then((results) => {
        if (cancelled) {
          return;
        }

        const restored = results.filter((result): result is NonNullable<typeof result> => Boolean(result?.targetFileId));
        if (restored.length === 0) {
          return;
        }

        mergeFiles(restored.flatMap((result) => result.files));
        setOpenFileIds(restored.map((result) => result.targetFileId));

        const activeTab = uiState.workspace.activeTab;
        const activeFileId =
          restored.find(
            (result) =>
              result.tab.relativePath === activeTab?.relativePath && result.tab.rootPath === activeTab?.rootPath,
          )?.targetFileId ?? restored[restored.length - 1]?.targetFileId ?? "";

        setActiveFileId(activeFileId);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [
    loadSystemSkillFiles,
    mergeFiles,
    openFileIds.length,
    setActiveFileId,
    setOpenFileIds,
    systemSkillByRootPath,
    systemSkillsLoading,
    uiState.workspace.activeTab,
    uiState.workspace.openTabs,
  ]);

  function openEditor() {
    setActiveFileSaveError(null);
    setWorkspaceView("editor");
    updateUiState((current) => ({
      ...current,
      workspaceView: "editor",
    }));
  }

  function openSettings() {
    setWorkspaceView("settings");
    updateUiState((current) => ({
      ...current,
      workspaceView: "settings",
    }));
  }

  function openMarketplace() {
    setActiveFileSaveError(null);
    setWorkspaceView("marketplace");
    updateUiState((current) => ({
      ...current,
      workspaceView: "marketplace",
    }));
  }

  function openMarketplaceSkillDetail(skill: MarketplaceSkill) {
    setMarketplaceInstallError(null);
    setMarketplaceInstallMessage(null);
    setSelectedMarketplaceSkill(skill);
    setWorkspaceView("marketplace");
    updateUiState((current) => ({
      ...current,
      workspaceView: "marketplace",
    }));
  }

  function closeMarketplaceSkillDetail() {
    setSelectedMarketplaceSkill(null);
  }

  function findInstalledMarketplaceSkill(skill: MarketplaceSkill) {
    const installedBySkillId = systemSkills.find(
      (systemSkill) => systemSkill.marketplaceInstall?.skillId === skill.id,
    );
    if (installedBySkillId) {
      return installedBySkillId;
    }

    return systemSkills.find((systemSkill) => {
      const metadata = systemSkill.marketplaceInstall;
      return Boolean(
        metadata?.githubUrl &&
        skill.githubUrl &&
        metadata.githubUrl === skill.githubUrl &&
        metadata.slug === skill.slug,
      );
    }) ?? null;
  }

  function isMarketplaceSkillUpdateAvailable(skill: MarketplaceSkill) {
    const installedSkill = findInstalledMarketplaceSkill(skill);
    if (!installedSkill?.marketplaceInstall?.remoteUpdatedAt) {
      return false;
    }

    const installedUpdatedAt = parseMarketplaceTimestamp(installedSkill.marketplaceInstall.remoteUpdatedAt);
    const remoteUpdatedAt = parseMarketplaceTimestamp(skill.updatedAt);

    if (installedUpdatedAt === null || remoteUpdatedAt === null) {
      return false;
    }

    return remoteUpdatedAt > installedUpdatedAt;
  }

  function installMarketplaceSkill(skill: MarketplaceSkill) {
    setMarketplaceInstallError(null);
    setMarketplaceInstallMessage(null);
    setInstallingMarketplaceSkillIds((current) => {
      const next = new Set(current);
      next.add(skill.id);
      return next;
    });

    return invoke<MarketplaceInstallResult>("install_marketplace_skill", {
      collection: preferences.marketplaceInstallCollection,
      skill,
      target: preferences.marketplaceInstallTarget,
    })
      .then((result) => {
        setMarketplaceInstallMessage(`Skill instalada en ${result.installedPath}`);
        pushToast({
          description: result.installedPath,
          kind: "success",
          title: `Installed ${skill.name}`,
        });
        return refreshSystemSkillTree();
      })
      .catch((error: unknown) => {
        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "No se pudo instalar la skill.";
        setMarketplaceInstallError(
          message,
        );
        pushToast({
          description: message,
          kind: "error",
          sticky: true,
          title: `Failed to install ${skill.name}`,
        });
        throw error;
      })
      .finally(() => {
        setInstallingMarketplaceSkillIds((current) => {
          const next = new Set(current);
          next.delete(skill.id);
          return next;
        });
      });
  }

  function updateMarketplaceSkill(skill: MarketplaceSkill) {
    const installedSkill = findInstalledMarketplaceSkill(skill);
    if (!installedSkill) {
      return Promise.reject(new Error("La skill no esta instalada."));
    }

    setMarketplaceInstallError(null);
    setMarketplaceInstallMessage(null);
    setUpdatingMarketplaceSkillIds((current) => {
      const next = new Set(current);
      next.add(skill.id);
      return next;
    });

    return invoke<MarketplaceInstallResult>("update_marketplace_skill", {
      rootPath: installedSkill.rootPath,
      skill,
    })
      .then((result) => {
        setMarketplaceInstallMessage(`Skill actualizada en ${result.installedPath}`);
        pushToast({
          description: result.installedPath,
          kind: "success",
          title: `Updated ${skill.name}`,
        });
        return refreshSystemSkillTree();
      })
      .catch((error: unknown) => {
        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "No se pudo actualizar la skill.";
        setMarketplaceInstallError(
          message,
        );
        pushToast({
          description: message,
          kind: "error",
          sticky: true,
          title: `Failed to update ${skill.name}`,
        });
        throw error;
      })
      .finally(() => {
        setUpdatingMarketplaceSkillIds((current) => {
          const next = new Set(current);
          next.delete(skill.id);
          return next;
        });
      });
  }

  function uninstallMarketplaceSkill(skill: MarketplaceSkill) {
    const installedSkill = findInstalledMarketplaceSkill(skill);
    if (!installedSkill) {
      return Promise.reject(new Error("La skill no esta instalada."));
    }

    setMarketplaceInstallError(null);
    setMarketplaceInstallMessage(null);
    setUninstallingMarketplaceSkillIds((current) => {
      const next = new Set(current);
      next.add(skill.id);
      return next;
    });

    return invoke<MarketplaceUninstallResult>("uninstall_marketplace_skill", {
      rootPath: installedSkill.rootPath,
    })
      .then((result) => {
        setMarketplaceInstallMessage(`Skill eliminada de ${result.removedPath}`);
        pushToast({
          description: result.removedPath,
          kind: "success",
          title: `Removed ${skill.name}`,
        });
        return refreshSystemSkillTree();
      })
      .catch((error: unknown) => {
        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "No se pudo eliminar la skill.";
        setMarketplaceInstallError(
          message,
        );
        pushToast({
          description: message,
          kind: "error",
          sticky: true,
          title: `Failed to remove ${skill.name}`,
        });
        throw error;
      })
      .finally(() => {
        setUninstallingMarketplaceSkillIds((current) => {
          const next = new Set(current);
          next.delete(skill.id);
          return next;
        });
      });
  }

  function openInstalledMarketplaceSkill(skill: MarketplaceSkill) {
    const installedSkill = findInstalledMarketplaceSkill(skill);
    if (!installedSkill) {
      return;
    }

    openSystemSkill(installedSkill);
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
              pushToast({
                kind: "success",
                title: `Saved ${fileToSave.relativePath}`,
              });
              return refreshSystemSkillTree();
            })
            .catch(() => {
              setActiveFileSaveError("Archivo guardado, pero no se pudo refrescar la skill.");
              pushToast({
                description: fileToSave.relativePath,
                kind: "error",
                sticky: true,
                title: "Saved file but failed to refresh skill",
              });
            });
      })
      .catch(() => {
        setActiveFileSaveError("No se pudo guardar el archivo.");
        pushToast({
          description: fileToSave.relativePath,
          kind: "error",
          sticky: true,
          title: "Failed to save file",
        });
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
    isMarketplaceSkillUpdateAvailable,
    installingMarketplaceSkillIds,
    installMarketplaceSkill,
    findInstalledMarketplaceSkill,
    listSystemSkillFiles,
    listedSystemSkillIds,
    listingSystemSkillIds,
    marketplaceError,
    marketplaceHasSearched,
    marketplaceInstallError,
    marketplaceInstallMessage,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    openMarketplaceSkillDetail,
    openInstalledMarketplaceSkill,
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
    selectedMarketplaceSkill,
    refreshSystemSkillTree,
    saveActiveFile,
    systemSkillActionError,
    systemSkillScanMs,
    systemSkillTree,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
    tree,
    uninstallMarketplaceSkill,
    updateActiveFile,
    updateMarketplaceSkill,
    updatingMarketplaceSkillIds,
    updatePreferences,
    uninstallingMarketplaceSkillIds,
    workspaceView,
    closeMarketplaceSkillDetail,
  };
}
