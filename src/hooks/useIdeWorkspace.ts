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
} from "../ide/types";
import { buildTree } from "../ide/utils";

export type WorkspaceView = "editor" | "marketplace" | "settings";

const IDE_PREFERENCES_KEY = "skills-ide:preferences";

const DEFAULT_IDE_PREFERENCES: IdePreferences = {
  cursorAnimation: true,
  fontLigatures: true,
  markdownWordWrap: true,
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
    let cancelled = false;

    setSystemSkillsLoading(true);
    setSystemSkillsError(null);

    invoke<SkillTreeResponse>("scan_system_skills_tree")
      .then((response) => {
        if (cancelled) {
          return;
        }

        const nextSystemSkills = flattenSystemSkillTree(response.roots);

        startTransition(() => {
          setSystemSkillTree(response.roots);
          setSystemSkills(nextSystemSkills);
          setSystemSkillScanMs(response.durationMs);
          setSystemSkillsLoading(false);
        });
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

    invoke<SystemSkillContentResponse>("load_system_skill", {
      rootPath: skill.rootPath,
    })
      .then((response) => {
        const workspaceRoot = getSystemSkillWorkspaceRoot(skill);
        const createdFiles: IdeFile[] = response.files.map((file) => ({
          id: getSystemSkillFileId(skill, file.relativePath),
          path: `${workspaceRoot}/${file.relativePath}`,
          language: file.language,
          content: file.content,
          savedContent: file.content,
        }));
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
    isSettingsView: workspaceView === "settings",
    marketplaceSkills,
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
    workspaceView,
  };
}
