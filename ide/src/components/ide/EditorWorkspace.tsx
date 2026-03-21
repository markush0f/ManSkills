import type { RefObject } from "react";
import type { IdeFile } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { shellPanelClass, tabActiveClass, tabClass } from "./ui";

type EditorWorkspaceProps = {
  activeFile: IdeFile;
  activeFileId: string;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  openFiles: IdeFile[];
  onCloseFile: (fileId: string) => void;
  onOpenFile: (fileId: string) => void;
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
  onUpdateFile,
}: EditorWorkspaceProps) {
  const lineNumbers = activeFile.content.split("\n");

  return (
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.94),rgba(12,20,27,0.88))]`}>
      <div className="border-b border-[var(--border)] px-4 py-3">
        <Tabs
          activeFileId={activeFileId}
          onCloseFile={onCloseFile}
          onOpenFile={onOpenFile}
          openFiles={openFiles}
        />
      </div>

      <div className="grid min-h-0 grid-cols-[60px_minmax(0,1fr)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(5,10,14,0.42))] md:grid-cols-[78px_minmax(0,1fr)]">
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
          className="h-full w-full resize-none overflow-auto bg-transparent px-6 py-5 font-mono text-[0.92rem] leading-7 text-[var(--ink)] outline-none"
          onChange={(event) => onUpdateFile(event.currentTarget.value)}
          spellCheck={false}
          value={activeFile.content}
        />
      </div>
    </section>
  );
}
