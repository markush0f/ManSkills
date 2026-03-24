import { invoke } from "@tauri-apps/api/core";
import { startTransition, useEffect, useState } from "react";
import { marketplaceSkills } from "../ide/marketplaceData";
import { initialFiles, initialOpenFileIds } from "../ide/mockData";
import type {
  IdeFile,
  MarketplaceSkill,
  SkillScanResponse,
  SystemSkill,
} from "../ide/types";
import { buildTree } from "../ide/utils";

export type WorkspaceView = "editor" | "marketplace";

export function useIdeWorkspace() {
  const [files, setFiles] = useState(initialFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialOpenFileIds);
  const [activeFileId, setActiveFileId] = useState(initialOpenFileIds[0] ?? initialFiles[0]?.id ?? "");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("editor");
  const [systemSkills, setSystemSkills] = useState<SystemSkill[]>([]);
  const [systemSkillsLoading, setSystemSkillsLoading] = useState(true);
  const [systemSkillsError, setSystemSkillsError] = useState<string | null>(null);
  const [systemSkillScanMs, setSystemSkillScanMs] = useState<number | null>(null);

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
    let cancelled = false;

    setSystemSkillsLoading(true);
    setSystemSkillsError(null);

    invoke<SkillScanResponse>("scan_system_skills")
      .then((response) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setSystemSkills(response.skills);
          setSystemSkillScanMs(response.durationMs);
          setSystemSkillsLoading(false);
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("Failed to scan system skills", error);
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

  return {
    activeFile,
    activeFileId,
    closeFile,
    files,
    installedSkillSlugs,
    installMarketplaceSkill,
    isMarketplaceView: workspaceView === "marketplace",
    marketplaceSkills,
    openFile,
    openFiles,
    openMarketplace,
    systemSkillScanMs,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
    tree,
    updateActiveFile,
    workspaceView,
  };
}
