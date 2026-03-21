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
    <div className="flex gap-2 overflow-x-auto pb-1">
      {openFiles.map((file) => {
        const isDirty = file.content !== file.savedContent;

        return (
          <button
            key={file.id}
            className={`${tabClass} ${activeFileId === file.id ? tabActiveClass : ""}`}
            onClick={() => onOpenFile(file.id)}
          >
            <span>{getFileName(file.path)}</span>
            {isDirty && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />}
            <span
              className="text-[var(--muted)]"
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
    <section className="grid min-w-0 gap-3">
      <Tabs
        activeFileId={activeFileId}
        onCloseFile={onCloseFile}
        onOpenFile={onOpenFile}
        openFiles={openFiles}
      />

      <div className={`${shellPanelClass} min-w-0 overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-white/4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={subtleLabelClass}>Archivo activo</p>
            <div className="flex flex-wrap items-center gap-3">
              <strong className="text-sm font-medium text-[var(--text)]">{activeFile.path}</strong>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  isDirty ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-white/5 text-[var(--muted)]"
                }`}
              >
                {isDirty ? "Sin guardar" : "Guardado"}
              </span>
            </div>
          </div>

          <button className={ghostButtonClass} onClick={onSaveFile}>
            Guardar
          </button>
        </div>

        <div className="grid min-h-[560px] grid-cols-[56px_minmax(0,1fr)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(15,24,32,0.44))] md:grid-cols-[72px_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="flex flex-col select-none border-r border-[var(--border)] bg-black/14 px-2 py-4 text-right font-mono text-sm leading-7 text-[rgba(143,154,168,0.86)]"
          >
            {lineNumbers.map((_, index) => (
              <span key={`${activeFile.id}-${index + 1}`}>{index + 1}</span>
            ))}
          </div>

          <textarea
            ref={editorRef}
            className="min-h-[560px] w-full resize-none bg-transparent px-5 py-4 font-mono text-[0.92rem] leading-7 text-[var(--ink)] outline-none"
            onChange={(event) => onUpdateFile(event.currentTarget.value)}
            spellCheck={false}
            value={activeFile.content}
          />
        </div>
      </div>
    </section>
  );
}
