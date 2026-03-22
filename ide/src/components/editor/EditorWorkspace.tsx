import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { getFileName, getLanguageLabel } from "../../ide/utils";
import { useIde } from "../../contexts/IdeContext";
import { JsonPreview } from "./JsonPreview";
import { MarkdownPreview } from "./MarkdownPreview";
import { shellPanelClass } from "../shared/ui";

function TabsBar({
  activeFileId,
  onCloseFile,
  onOpenFile,
  openFiles,
}: {
  activeFileId: string;
  onCloseFile: (fileId: string) => void;
  onOpenFile: (fileId: string) => void;
  openFiles: ReturnType<typeof useIde>["openFiles"];
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

export function EditorWorkspace() {
  const { activeFile, activeFileId, closeFile, openFile, openFiles, updateActiveFile } = useIde();
  const [contentView, setContentView] = useState<"preview" | "code" | "split">("code");
  const isMarkdown = activeFile.language === "md";
  const isJson = activeFile.language === "json";
  const supportsPreview = isMarkdown || isJson;
  const previewLabel = isJson ? "Ver JSON formateado" : "Vista visual";
  const codeLabel = isJson ? "Ver JSON como código" : "Vista código";
  const splitLabel = isJson ? "Ver JSON formateado y código" : "Vista dividida";
  const controlsColumnClass = supportsPreview ? "w-[172px] md:w-[220px]" : "w-[72px] md:w-[132px]";

  useEffect(() => {
    if (!supportsPreview) {
      setContentView("code");
      return;
    }

    setContentView("code");
  }, [activeFile.id, supportsPreview]);

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
          onChange={(value) => updateActiveFile(value ?? "")}
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
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] border-b border-[var(--border)]">
        <div className="min-w-0 overflow-hidden">
          <TabsBar
            activeFileId={activeFileId}
            onCloseFile={closeFile}
            onOpenFile={openFile}
            openFiles={openFiles}
          />
        </div>

        <div
          className={`flex shrink-0 items-center justify-end gap-2 border-l border-[var(--border)] bg-[linear-gradient(180deg,rgba(10,16,22,0.98),rgba(12,20,27,0.96))] px-3 ${controlsColumnClass}`}
        >
          <span className="hidden text-xs text-[var(--muted)] md:block">
            {getLanguageLabel(activeFile.language)}
          </span>
          {supportsPreview && (
            <div className="flex items-center gap-1 rounded-[10px] border border-[var(--border)] bg-white/5 p-1">
              <button
                aria-label={codeLabel}
                className={`rounded-[8px] px-2.5 py-1.5 text-xs transition md:px-3 ${
                  contentView === "code"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
                onClick={() => setContentView("code")}
                title={codeLabel}
              >
                <span aria-hidden="true">{"</>"}</span>
              </button>
              <button
                aria-label={previewLabel}
                className={`rounded-[8px] px-2.5 py-1.5 text-xs transition md:px-3 ${
                  contentView === "preview"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
                onClick={() => setContentView("preview")}
                title={previewLabel}
              >
                <span aria-hidden="true">{isJson ? "{}" : "◉"}</span>
              </button>
              <button
                aria-label={splitLabel}
                className={`rounded-[8px] px-2.5 py-1.5 text-xs transition md:px-3 ${
                  contentView === "split"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
                onClick={() => setContentView("split")}
                title={splitLabel}
              >
                <span aria-hidden="true">◫</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 bg-[var(--editor-surface)]">
        {supportsPreview && contentView === "preview" ? (
          isMarkdown ? (
          <MarkdownPreview content={activeFile.content} />
          ) : (
            <JsonPreview content={activeFile.content} />
          )
        ) : supportsPreview && contentView === "split" ? (
          <div className="grid h-full min-h-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-h-0 border-b border-[var(--border)] xl:border-b-0 xl:border-r">
              {renderCodeEditor()}
            </div>
            <div className="min-h-0">
              {isMarkdown ? (
                <MarkdownPreview content={activeFile.content} compact />
              ) : (
                <JsonPreview content={activeFile.content} compact />
              )}
            </div>
          </div>
        ) : (
          renderCodeEditor()
        )}
      </div>
    </section>
  );
}
