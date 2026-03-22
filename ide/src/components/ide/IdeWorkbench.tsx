import { useEffect, useRef, useState } from "react";
import { marketplaceSkills } from "../../ide/marketplaceData";
import { initialFiles, initialOpenFileIds } from "../../ide/mockData";
import type { IdeFile, MarketplaceSkill } from "../../ide/types";
import { buildTree } from "../../ide/utils";
import { EditorWorkspace } from "./EditorWorkspace";
import { MarketplaceWorkspace } from "./MarketplaceWorkspace";
import { Sidebar } from "./Sidebar";

const SIDEBAR_WIDTH_KEY = "skills-ide:sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 296;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;
const MIN_CONTENT_WIDTH = 480;
const RESIZER_WIDTH = 6;

function clampSidebarWidth(width: number, containerWidth?: number) {
  const containerLimit = containerWidth
    ? Math.max(MIN_SIDEBAR_WIDTH, containerWidth - RESIZER_WIDTH - MIN_CONTENT_WIDTH)
    : MAX_SIDEBAR_WIDTH;

  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), Math.min(MAX_SIDEBAR_WIDTH, containerLimit));
}

export function IdeWorkbench() {
  const layoutRef = useRef<HTMLElement | null>(null);
  const [files, setFiles] = useState(initialFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialOpenFileIds);
  const [activeFileId, setActiveFileId] = useState(initialOpenFileIds[0] ?? initialFiles[0]?.id ?? "");
  const [workspaceView, setWorkspaceView] = useState<"editor" | "marketplace">("editor");
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SIDEBAR_WIDTH;
    }

    const storedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(storedWidth) && storedWidth > 0 ? storedWidth : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

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
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const layoutWidth = layoutRef.current?.clientWidth;
      setSidebarWidth(clampSidebarWidth(event.clientX - (layoutRef.current?.getBoundingClientRect().left ?? 0), layoutWidth));
    };

    const stopResize = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    const handleResize = () => {
      const layoutWidth = layoutRef.current?.clientWidth;
      setSidebarWidth((current) => clampSidebarWidth(current, layoutWidth));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

      <section
        ref={layoutRef}
        className="grid h-[calc(100vh-24px)] rounded-[24px] border border-[var(--border)] bg-[rgba(6,11,16,0.46)] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        style={{
          gridTemplateColumns: `${sidebarWidth}px ${RESIZER_WIDTH}px minmax(0, 1fr)`,
        }}
      >
        <div className="min-w-0 overflow-hidden">
          <Sidebar
            activeFileId={activeFileId}
            files={files}
            isMarketplaceView={workspaceView === "marketplace"}
            onOpenFile={openFile}
            onOpenMarketplace={() => setWorkspaceView("marketplace")}
            tree={tree}
          />
        </div>

        <div className="flex items-stretch justify-center">
          <button
            aria-label="Redimensionar panel lateral"
            className={`group flex h-full w-full cursor-col-resize items-center justify-center bg-transparent transition ${
              isResizing ? "bg-white/4" : "hover:bg-white/[0.03]"
            }`}
            onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
            onPointerDown={(event) => {
              event.preventDefault();
              setIsResizing(true);
            }}
            title="Arrastra para cambiar el tamaño"
            type="button"
          >
            <span
              className={`h-full w-px transition ${
                isResizing ? "bg-[var(--accent)]" : "bg-[var(--border)] group-hover:bg-white/18"
              }`}
            />
          </button>
        </div>

        <div className="min-w-0 overflow-hidden">
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
        </div>
      </section>
    </main>
  );
}
