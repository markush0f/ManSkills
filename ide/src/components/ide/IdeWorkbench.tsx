import { useEffect, useRef, useState } from "react";
import { initialFiles, initialOpenFileIds } from "../../ide/mockData";
import type { IdeFile } from "../../ide/types";
import { buildTree } from "../../ide/utils";
import { EditorWorkspace } from "./EditorWorkspace";
import { Sidebar } from "./Sidebar";

export function IdeWorkbench() {
  const [files, setFiles] = useState(initialFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialOpenFileIds);
  const [activeFileId, setActiveFileId] = useState("app");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const tree = buildTree(files);
  const openFiles = openFileIds
    .map((fileId) => files.find((file) => file.id === fileId))
    .filter((file): file is IdeFile => Boolean(file));

  useEffect(() => {
    if (!activeFile) {
      return;
    }

    editorRef.current?.focus();
  }, [activeFile]);

  function openFile(fileId: string) {
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds((current) => [...current, fileId]);
    }

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

  function saveActiveFile() {
    setFiles((current) =>
      current.map((file) =>
        file.id === activeFile.id
          ? {
              ...file,
              savedContent: file.content,
            }
          : file,
      ),
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-3 py-3 text-[var(--text)] md:px-4 md:py-4">
      <div className="pointer-events-none absolute left-[-140px] top-20 h-72 w-72 rounded-full bg-[rgba(217,98,59,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-0 h-80 w-80 rounded-full bg-[rgba(79,143,137,0.12)] blur-3xl" />

      <section className="grid min-h-[calc(100vh-24px)] gap-3 rounded-[24px] border border-[var(--border)] bg-[rgba(6,11,16,0.46)] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl xl:grid-cols-[320px_minmax(0,1fr)]">
        <Sidebar activeFileId={activeFileId} files={files} onOpenFile={openFile} tree={tree} />

        <EditorWorkspace
          activeFile={activeFile}
          activeFileId={activeFileId}
          editorRef={editorRef}
          onCloseFile={closeFile}
          onOpenFile={openFile}
          onSaveFile={saveActiveFile}
          onUpdateFile={updateActiveFile}
          openFiles={openFiles}
        />
      </section>
    </main>
  );
}
