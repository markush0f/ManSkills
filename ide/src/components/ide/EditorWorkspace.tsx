import { useEffect, useState, type RefObject } from "react";
import type { IdeFile } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { MarkdownPreview } from "./MarkdownPreview";
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
  const [markdownView, setMarkdownView] = useState<"preview" | "markdown" | "split">("split");
  const lineNumbers = activeFile.content.split("\n");
  const isMarkdown = activeFile.language === "md";

  useEffect(() => {
    if (!isMarkdown) {
      setMarkdownView("markdown");
      return;
    }

    setMarkdownView("split");
  }, [activeFile.id, isMarkdown]);

  function renderCodeEditor() {
    return (
      <div className="grid h-full min-h-0 grid-cols-[60px_minmax(0,1fr)] md:grid-cols-[78px_minmax(0,1fr)]">
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
    );
  }

  return (
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.94),rgba(12,20,27,0.88))]`}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <Tabs
          activeFileId={activeFileId}
          onCloseFile={onCloseFile}
          onOpenFile={onOpenFile}
          openFiles={openFiles}
        />

        {isMarkdown && (
          <div className="flex items-center gap-1 rounded-[10px] border border-[var(--border)] bg-white/5 p-1">
            <button
              aria-label="Vista visual"
              className={`rounded-[8px] px-3 py-1.5 text-xs transition ${
                markdownView === "preview"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => setMarkdownView("preview")}
              title="Vista visual"
            >
              <span aria-hidden="true">◉</span>
            </button>
            <button
              aria-label="Vista markdown"
              className={`rounded-[8px] px-3 py-1.5 text-xs transition ${
                markdownView === "markdown"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => setMarkdownView("markdown")}
              title="Vista markdown"
            >
              <span aria-hidden="true">{"</>"}</span>
            </button>
            <button
              aria-label="Vista dividida"
              className={`rounded-[8px] px-3 py-1.5 text-xs transition ${
                markdownView === "split"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => setMarkdownView("split")}
              title="Vista dividida"
            >
              <span aria-hidden="true">◫</span>
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(5,10,14,0.42))]">
        {isMarkdown && markdownView === "preview" ? (
          <MarkdownPreview content={activeFile.content} />
        ) : isMarkdown && markdownView === "split" ? (
          <div className="grid h-full min-h-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-h-0 border-b border-[var(--border)] xl:border-b-0 xl:border-r">
              {renderCodeEditor()}
            </div>
            <div className="min-h-0">
              <MarkdownPreview content={activeFile.content} compact />
            </div>
          </div>
        ) : (
          renderCodeEditor()
        )}
      </div>
    </section>
  );
}
