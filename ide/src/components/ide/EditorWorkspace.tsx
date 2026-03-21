import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import type { IdeFile } from "../../ide/types";
import { getFileName, getLanguageLabel } from "../../ide/utils";
import { MarkdownPreview } from "./MarkdownPreview";
import { shellPanelClass } from "./ui";

type EditorWorkspaceProps = {
  activeFile: IdeFile;
  activeFileId: string;
  openFiles: IdeFile[];
  onCloseFile: (fileId: string) => void;
  onOpenFile: (fileId: string) => void;
  onUpdateFile: (content: string) => void;
};

function TabsBar({
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
    <div className="flex min-w-0 items-center overflow-x-auto">
      {openFiles.map((file) => {
        const isDirty = file.content !== file.savedContent;
        const isActive = file.id === activeFileId;

        return (
          <button
            key={file.id}
            className={`inline-flex h-11 shrink-0 items-center gap-2 border-r border-[var(--border)] px-4 text-sm transition ${
              isActive
                ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)]"
                : "bg-transparent text-[var(--muted)] hover:bg-white/4 hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenFile(file.id)}
          >
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
              {file.language}
            </span>
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
  openFiles,
  onCloseFile,
  onOpenFile,
  onUpdateFile,
}: EditorWorkspaceProps) {
  const [markdownView, setMarkdownView] = useState<"preview" | "markdown" | "split">("split");
  const isMarkdown = activeFile.language === "md";

  useEffect(() => {
    if (!isMarkdown) {
      setMarkdownView("markdown");
      return;
    }

    setMarkdownView("split");
  }, [activeFile.id, isMarkdown]);

  function getMonacoLanguage() {
    if (activeFile.language === "md") return "markdown";
    if (activeFile.language === "ts") return "typescript";
    return "json";
  }

  function renderCodeEditor() {
    return (
      <div className="h-full min-h-0 bg-[var(--editor-surface)]">
        <Editor
          height="100%"
          language={getMonacoLanguage()}
          options={{
            automaticLayout: true,
            fontSize: 14,
            lineHeight: 28,
            minimap: { enabled: false },
            padding: { top: 20, bottom: 20 },
            renderLineHighlight: "none",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
              horizontalScrollbarSize: 10,
              verticalScrollbarSize: 10,
            },
            smoothScrolling: true,
            wordWrap: activeFile.language === "md" ? "on" : "off",
          }}
          path={activeFile.path}
          theme="vs-dark"
          value={activeFile.content}
          onChange={(value) => onUpdateFile(value ?? "")}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme("skills-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": "#0f1820",
                "editorLineNumber.foreground": "#6f7c8a",
                "editorLineNumber.activeForeground": "#c8d3de",
                "editorGutter.background": "#0f1820",
                "editorIndentGuide.background1": "#1a2530",
                "editorIndentGuide.activeBackground1": "#2b3946",
              },
            });
          }}
          onMount={(editor, monaco) => {
            monaco.editor.setTheme("skills-dark");
            editor.updateOptions({
              scrollbar: {
                alwaysConsumeMouseWheel: false,
                horizontalScrollbarSize: 10,
                verticalScrollbarSize: 10,
              },
            });
          }}
        />
      </div>
    );
  }

  return (
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.94),rgba(12,20,27,0.88))]`}>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-stretch border-b border-[var(--border)]">
        <div className="min-w-0 overflow-hidden">
          <TabsBar
            activeFileId={activeFileId}
            onCloseFile={onCloseFile}
            onOpenFile={onOpenFile}
            openFiles={openFiles}
          />
        </div>

        <div className="flex items-center gap-3 border-l border-[var(--border)] px-3">
          <span className="hidden text-xs text-[var(--muted)] lg:block">
            {getLanguageLabel(activeFile.language)}
          </span>
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
      </div>

      <div className="min-h-0 bg-[var(--editor-surface)]">
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
