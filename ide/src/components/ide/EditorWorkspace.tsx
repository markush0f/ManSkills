import type { RefObject } from "react";
import type { IdeFile } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { ghostButtonClass, shellPanelClass, subtleLabelClass, tabActiveClass, tabClass } from "./ui";

type EditorWorkspaceProps = {
  activeFile: IdeFile;
  activeFileId: string;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  openFiles: IdeFile[];
  onCloseFile: (fileId: string) => void;
  onOpenFile: (fileId: string) => void;
  onSaveFile: () => void;
  onUpdateFile: (content: string) => void;
};

function Tabs({
  activeFileId,
  onCloseFile,
  onOpenFile,
  openFiles,
}: {
  activeFileId: string;
  onCloseFile: (fileId: string) => void;
  onOpenFile: (fileId: string) => void;
  openFiles: IdeFile[];
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {openFiles.map((file) => {
        const isDirty = file.content !== file.savedContent;

        return (
          <button
            key={file.id}
            className={`${tabClass} ${activeFileId === file.id ? tabActiveClass : ""}`}
            onClick={() => onOpenFile(file.id)}
          >
            <span>{getFileName(file.path)}</span>
            {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
            <span
              className="text-[var(--muted)] hover:text-[var(--text)]"
              onClick={(event) => {
                event.stopPropagation();
                onCloseFile(file.id);
              }}
            >
              x
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function EditorWorkspace({
  activeFile,
  activeFileId,
  editorRef,
  openFiles,
  onCloseFile,
  onOpenFile,
  onSaveFile,
  onUpdateFile,
}: EditorWorkspaceProps) {
  const lineNumbers = activeFile.content.split("\n");
  const isDirty = activeFile.content !== activeFile.savedContent;

  return (
    <section className={`${shellPanelClass} grid min-w-0 overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.94),rgba(12,20,27,0.88))]`}>
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            activeFileId={activeFileId}
            onCloseFile={onCloseFile}
            onOpenFile={onOpenFile}
            openFiles={openFiles}
          />

          <div className="flex items-center gap-3">
            <div className="hidden text-right lg:block">
              <p className={subtleLabelClass}>Archivo activo</p>
              <strong className="text-sm font-medium text-[var(--text)]">{activeFile.path}</strong>
            </div>
            <button className={ghostButtonClass} onClick={onSaveFile}>
              Guardar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className={`rounded-[8px] px-2.5 py-1 ${isDirty ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-white/5"}`}>
            {isDirty ? "Sin guardar" : "Guardado"}
          </span>
          <span className="truncate">{activeFile.path}</span>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-90px)] grid-cols-[60px_minmax(0,1fr)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(5,10,14,0.42))] md:grid-cols-[78px_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="flex flex-col select-none border-r border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-2 py-5 text-right font-mono text-sm leading-7 text-[rgba(143,154,168,0.76)]"
          >
            {lineNumbers.map((_, index) => (
              <span key={`${activeFile.id}-${index + 1}`}>{index + 1}</span>
            ))}
          </div>

          <textarea
            ref={editorRef}
            className="min-h-[calc(100vh-90px)] w-full resize-none bg-transparent px-6 py-5 font-mono text-[0.92rem] leading-7 text-[var(--ink)] outline-none"
            onChange={(event) => onUpdateFile(event.currentTarget.value)}
            spellCheck={false}
            value={activeFile.content}
          />
      </div>
    </section>
  );
}
