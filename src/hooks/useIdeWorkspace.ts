import { invoke } from "@tauri-apps/api/core";
import { startTransition, useEffect, useState } from "react";
import { marketplaceSkills } from "../ide/marketplaceData";
import { initialFiles, initialOpenFileIds } from "../ide/mockData";
import type {
  IdeFile,
  IdePreferences,
  MarketplaceSkill,
  SkillTreeResponse,
  SystemSkill,
  SystemSkillContentResponse,
  SystemSkillTreeNode,
} from "../types";
import { buildTree } from "../ide/utils";

export type WorkspaceView = "editor" | "marketplace" | "settings";

const IDE_PREFERENCES_KEY = "skills-ide:preferences";

const DEFAULT_IDE_PREFERENCES: IdePreferences = {
  bracketPairGuides: true,
  cursorAnimation: true,
  cursorStyle: "line-thin",
  fontLigatures: true,
  fontSize: 14,
  highlightActiveLine: false,
  lineHeight: 28,
  lineNumbers: "on",
  markdownWordWrap: true,
  minimap: false,
  renderWhitespace: "selection",
  saveShortcut: "mod+s",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  tabSize: 4,
};

function hashString(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
}

function getSystemSkillWorkspaceRoot(skill: SystemSkill) {
  return `system-skills/${skill.slug}-${hashString(skill.id)}`;
}

function getSystemSkillMainFileId(skill: SystemSkill) {
  return `system-skill:${skill.id}:SKILL.md`;
}

function getSystemSkillFileId(skill: SystemSkill, relativePath: string) {
  return `system-skill:${skill.id}:${relativePath}`;
}

function flattenSystemSkillTree(nodes: SystemSkillTreeNode[]): SystemSkill[] {
  return nodes.flatMap((node) => {
    const currentSkill = node.skill ? [node.skill] : [];
    return [...currentSkill, ...flattenSystemSkillTree(node.children)];
  });
}

function buildSystemSkillFiles(
  skill: SystemSkill,
  response: SystemSkillContentResponse,
): IdeFile[] {
  const workspaceRoot = getSystemSkillWorkspaceRoot(skill);

  return response.files.map((file) => ({
    id: getSystemSkillFileId(skill, file.relativePath),
    path: `${workspaceRoot}/${file.relativePath}`,
    language: file.language,
    content: file.content,
    savedContent: file.content,
    rootPath: response.rootPath,
    relativePath: file.relativePath,
    isWritable: true,
  }));
}

function mergeRefreshedSystemSkillFiles(currentFiles: IdeFile[], refreshedFiles: IdeFile[]): IdeFile[] {
  const refreshedFileMap = new Map(refreshedFiles.map((file) => [file.id, file]));

  return currentFiles.map((file) => {
    const refreshedFile = refreshedFileMap.get(file.id);

    if (!refreshedFile) {
      return file;
    }

    if (file.content !== file.savedContent) {
      return {
        ...file,
        savedContent: refreshedFile.savedContent,
      };
    }

    return refreshedFile;
  });
}

export function useIdeWorkspace() {
  const [files, setFiles] = useState(initialFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialOpenFileIds);
  const [activeFileId, setActiveFileId] = useState(initialOpenFileIds[0] ?? initialFiles[0]?.id ?? "");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("editor");
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
    } catch (error) {
      console.error("Failed to read IDE preferences", error);
      return DEFAULT_IDE_PREFERENCES;
    }
  });
  const [systemSkills, setSystemSkills] = useState<SystemSkill[]>([]);
  const [systemSkillTree, setSystemSkillTree] = useState<SystemSkillTreeNode[]>([]);
  const [systemSkillsLoading, setSystemSkillsLoading] = useState(true);
  const [systemSkillsError, setSystemSkillsError] = useState<string | null>(null);
  const [systemSkillScanMs, setSystemSkillScanMs] = useState<number | null>(null);
  const [openingSystemSkillId, setOpeningSystemSkillId] = useState<string | null>(null);
  const [isSavingActiveFile, setIsSavingActiveFile] = useState(false);
  const [activeFileSaveError, setActiveFileSaveError] = useState<string | null>(null);

  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const tree = buildTree(files);
  const openFiles = openFileIds
    .map((fileId) => files.find((file) => file.id === fileId))
    .filter((file): file is IdeFile => Boolean(file));
  const installedSkillSlugs = new Set(
    files
      .filter((file) => file.path.startsWith("skills/"))
      .map((file) => file.path.split("/")[1])
      .filter(Boolean),
  );

  useEffect(() => {
    window.localStorage.setItem(IDE_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    setActiveFileSaveError(null);
  }, [activeFileId]);

  useEffect(() => {
    const hasUnsavedChanges = files.some((file) => file.content !== file.savedContent);
    const baseTitle = "Skills management";

    if (typeof document === "undefined") {
      return;
    }

    document.title = hasUnsavedChanges ? `• ${baseTitle}` : baseTitle;
  }, [files]);

  useEffect(() => {
    let cancelled = false;

    setSystemSkillsLoading(true);
    setSystemSkillsError(null);

    fetchSystemSkillTree()
      .then((response) => {
        if (cancelled) {
          return;
        }

        applySystemSkillTree(response);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("Failed to scan system skills", error);
        setSystemSkillTree([]);
        setSystemSkills([]);
        setSystemSkillScanMs(null);
        setSystemSkillsError("No se pudieron cargar las skills del sistema.");
        setSystemSkillsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function applySystemSkillTree(response: SkillTreeResponse) {
    const nextSystemSkills = flattenSystemSkillTree(response.roots);

    startTransition(() => {
      setSystemSkillTree(response.roots);
      setSystemSkills(nextSystemSkills);
      setSystemSkillScanMs(response.durationMs);
      setSystemSkillsLoading(false);
    });
  }

  function fetchSystemSkillTree() {
    return invoke<SkillTreeResponse>("scan_system_skills_tree");
  }

  function refreshSystemSkillTree() {
    return fetchSystemSkillTree().then((response) => {
      applySystemSkillTree(response);
      return response;
    });
  }

  function loadSystemSkillFiles(skill: SystemSkill) {
    return invoke<SystemSkillContentResponse>("load_system_skill", {
      rootPath: skill.rootPath,
    });
  }

  function refreshSystemSkillFiles(skill: SystemSkill) {
    return loadSystemSkillFiles(skill).then((response) => {
      const refreshedFiles = buildSystemSkillFiles(skill, response);

      startTransition(() => {
        setFiles((current) => mergeRefreshedSystemSkillFiles(current, refreshedFiles));
      });

      return response;
    });
  }

  function openFile(fileId: string) {
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds((current) => [...current, fileId]);
    }

    setWorkspaceView("editor");
    setActiveFileId(fileId);
  }

  function openMarketplace() {
    setWorkspaceView("marketplace");
  }

  function openSettings() {
    setWorkspaceView("settings");
  }

  function closeFile(fileId: string) {
    const nextOpen = openFileIds.filter((currentId) => currentId !== fileId);

    if (nextOpen.length === 0) {
      return;
    }

    setOpenFileIds(nextOpen);

    if (activeFileId === fileId) {
      setActiveFileId(nextOpen[nextOpen.length - 1]);
    }
  }

  function updateActiveFile(content: string) {
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

  function updatePreferences(nextPreferences: Partial<IdePreferences>) {
    setPreferences((current) => ({
      ...current,
      ...nextPreferences,
    }));
  }

  function saveActiveFile(nextContent?: string) {
    if (!activeFile?.isWritable || !activeFile.rootPath || !activeFile.relativePath) {
      return Promise.resolve();
    }

    const activeSkill = systemSkills.find((skill) => skill.rootPath === activeFile.rootPath);
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
        setFiles((current) =>
          current.map((file) =>
            file.id === fileToSave.id
              ? {
                  ...file,
                  content: contentToSave,
                  savedContent: contentToSave,
                }
              : file,
          ),
        );

        setIsSavingActiveFile(false);

        if (activeSkill) {
          void refreshSystemSkillFiles(activeSkill)
            .then(() => refreshSystemSkillTree())
            .catch((error) => {
              console.error(`Saved file but failed to refresh skill: ${fileToSave.path}`, error);
              setActiveFileSaveError("Archivo guardado, pero no se pudo refrescar la skill.");
            });
        }
      })
      .catch((error) => {
        console.error(`Failed to save system skill file: ${fileToSave.path}`, error);
        setActiveFileSaveError("No se pudo guardar el archivo.");
        setIsSavingActiveFile(false);
      });
  }

  function installMarketplaceSkill(skill: MarketplaceSkill) {
    const existingMainFile = files.find((file) => file.path === `skills/${skill.slug}/SKILL.md`);

    if (existingMainFile) {
      openFile(existingMainFile.id);
      return;
    }

    const createdFiles: IdeFile[] = skill.files.map((file) => ({
      id: `${skill.id}-${file.idSuffix}`,
      path: `skills/${skill.slug}/${file.path}`,
      language: file.language,
      content: file.content,
      savedContent: file.content,
    }));

    const mainFileId = createdFiles[0]?.id;

    setFiles((current) => [...current, ...createdFiles]);

    if (mainFileId) {
      setOpenFileIds((current) => (current.includes(mainFileId) ? current : [...current, mainFileId]));
      setWorkspaceView("editor");
      setActiveFileId(mainFileId);
    }
  }

  function openSystemSkill(skill: SystemSkill) {
    openSystemSkillFile(skill, "SKILL.md");
  }

  function openSystemSkillFile(skill: SystemSkill, relativePath: string) {
    const targetFileId = getSystemSkillFileId(skill, relativePath);
    const existingFile = files.find((file) => file.id === targetFileId);

    if (existingFile) {
      openFile(existingFile.id);
      return;
    }

    setOpeningSystemSkillId(skill.id);

    loadSystemSkillFiles(skill)
      .then((response) => {
        const createdFiles = buildSystemSkillFiles(skill, response);
        const nextFileId =
          createdFiles.find((file) => file.id === targetFileId)?.id ??
          createdFiles.find((file) => file.id === getSystemSkillMainFileId(skill))?.id ??
          createdFiles[0]?.id;

        startTransition(() => {
          setFiles((current) => {
            const existingIds = new Set(current.map((file) => file.id));
            return [...current, ...createdFiles.filter((file) => !existingIds.has(file.id))];
          });

          if (nextFileId) {
            setOpenFileIds((current) => (current.includes(nextFileId) ? current : [...current, nextFileId]));
            setWorkspaceView("editor");
            setActiveFileId(nextFileId);
          }
        });
      })
      .catch((error) => {
        console.error(`Failed to load system skill: ${skill.rootPath}`, error);
      })
      .finally(() => {
        setOpeningSystemSkillId((current) => (current === skill.id ? null : current));
      });
  }

  return {
    activeFile,
    activeFileId,
    closeFile,
    files,
    installedSkillSlugs,
    installMarketplaceSkill,
    isMarketplaceView: workspaceView === "marketplace",
    isSavingActiveFile,
    isSettingsView: workspaceView === "settings",
    marketplaceSkills,
    activeFileSaveError,
    openFile,
    openFiles,
    openMarketplace,
    openSettings,
    openSystemSkill,
    openSystemSkillFile,
    openingSystemSkillId,
    preferences,
    systemSkillScanMs,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
    systemSkillTree,
    tree,
    updateActiveFile,
    updatePreferences,
    saveActiveFile,
    workspaceView,
  };
}
