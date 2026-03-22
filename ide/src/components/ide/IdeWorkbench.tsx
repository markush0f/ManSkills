import { useState } from "react";
import { marketplaceSkills } from "../../ide/marketplaceData";
import { initialFiles, initialOpenFileIds } from "../../ide/mockData";
import type { IdeFile, MarketplaceSkill } from "../../ide/types";
import { buildTree } from "../../ide/utils";
import { EditorWorkspace } from "./EditorWorkspace";
import { MarketplaceWorkspace } from "./MarketplaceWorkspace";
import { Sidebar } from "./Sidebar";

export function IdeWorkbench() {
  const [files, setFiles] = useState(initialFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialOpenFileIds);
  const [activeFileId, setActiveFileId] = useState(initialOpenFileIds[0] ?? initialFiles[0]?.id ?? "");
  const [workspaceView, setWorkspaceView] = useState<"editor" | "marketplace">("editor");

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

  function openFile(fileId: string) {
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds((current) => [...current, fileId]);
    }

    setWorkspaceView("editor");
    setActiveFileId(fileId);
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

  return (
    <main className="relative h-screen w-full overflow-hidden px-3 py-3 text-[var(--text)] md:px-4 md:py-4">
      <div className="pointer-events-none absolute left-[-140px] top-20 h-72 w-72 rounded-full bg-[rgba(217,98,59,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-0 h-80 w-80 rounded-full bg-[rgba(79,143,137,0.12)] blur-3xl" />

      <section className="grid h-[calc(100vh-24px)] gap-3 rounded-[24px] border border-[var(--border)] bg-[rgba(6,11,16,0.46)] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl xl:grid-cols-[320px_minmax(0,1fr)]">
        <Sidebar
          activeFileId={activeFileId}
          files={files}
          isMarketplaceView={workspaceView === "marketplace"}
          onOpenFile={openFile}
          onOpenMarketplace={() => setWorkspaceView("marketplace")}
          tree={tree}
        />

        {workspaceView === "marketplace" ? (
          <MarketplaceWorkspace
            installedSkillSlugs={installedSkillSlugs}
            marketplaceSkills={marketplaceSkills}
            onInstallSkill={installMarketplaceSkill}
          />
        ) : (
          <EditorWorkspace
            activeFile={activeFile}
            activeFileId={activeFileId}
            onCloseFile={closeFile}
            onOpenFile={openFile}
            onUpdateFile={updateActiveFile}
            openFiles={openFiles}
          />
        )}
      </section>
    </main>
  );
}
