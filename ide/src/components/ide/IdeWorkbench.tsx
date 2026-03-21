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
    <main className="relative min-h-screen w-full overflow-hidden px-4 py-5 text-[var(--text)] md:px-6 xl:px-5">
      <div className="pointer-events-none absolute left-[-120px] top-24 h-64 w-64 rounded-full bg-[rgba(217,98,59,0.10)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-80px] top-8 h-72 w-72 rounded-full bg-[rgba(239,142,73,0.12)] blur-3xl" />

      <section className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
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
