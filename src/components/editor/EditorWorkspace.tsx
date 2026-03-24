import Editor from "@monaco-editor/react";
import { useDeferredValue, useEffect, useState } from "react";
import { getFileName } from "../../ide/utils";
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
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto px-2 py-2">
      {openFiles.map((file) => {
        const isDirty = file.content !== file.savedContent;
        const isActive = file.id === activeFileId;

        return (
          <button
            key={file.id}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] border px-3 text-[13px] transition ${
              isActive
                ? "border-[var(--border)] bg-white/4 text-[var(--text)]"
                : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/[0.03] hover:text-[var(--text)]"
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
  const { activeFile, activeFileId, closeFile, openFile, openFiles, preferences, updateActiveFile } = useIde();
  const [contentView, setContentView] = useState<"preview" | "code" | "split">("code");
  const [draftContent, setDraftContent] = useState(activeFile.content);
  const isMarkdown = activeFile.language === "md";
  const isJson = activeFile.language === "json";
  const supportsPreview = isMarkdown || isJson;
  const deferredContent = useDeferredValue(draftContent);

  useEffect(() => {
    if (!supportsPreview) {
      setContentView("code");
      return;
    }

    setContentView("code");
  }, [activeFile.id, supportsPreview]);

  useEffect(() => {
    setDraftContent(activeFile.content);
  }, [activeFile.id]);

  useEffect(() => {
    if (draftContent === activeFile.content) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateActiveFile(draftContent);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeFile.content, draftContent, updateActiveFile]);

  function getMonacoLanguage() {
    if (activeFile.language === "md") return "markdown";
    if (activeFile.language === "ts") return "typescript";
    if (activeFile.language === "txt") return "plaintext";
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
            cursorBlinking: preferences.cursorAnimation ? "smooth" : "blink",
            cursorSmoothCaretAnimation: preferences.cursorAnimation ? "on" : "off",
            cursorStyle: "line-thin",
            fontFamily: "Cascadia Code, Cascadia Mono, Consolas, SFMono-Regular, monospace",
            fontLigatures: preferences.fontLigatures,
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
            wordWrap: activeFile.language === "md" && preferences.markdownWordWrap ? "on" : "off",
          }}
          path={activeFile.path}
          theme="vs-dark"
          value={draftContent}
          onChange={(value) => setDraftContent(value ?? "")}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme("skills-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": "#091119",
                "editorWidget.background": "#091018",
                "editorLineNumber.foreground": "#62707f",
                "editorLineNumber.activeForeground": "#c8d3de",
                "editorGutter.background": "#091119",
                "editorIndentGuide.background1": "#141d27",
                "editorIndentGuide.activeBackground1": "#24313d",
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
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden`}>
      <div className="min-w-0 overflow-hidden border-b border-[var(--border)] bg-[rgba(4,8,12,0.94)]">
        <TabsBar
          activeFileId={activeFileId}
          onCloseFile={closeFile}
          onOpenFile={openFile}
          openFiles={openFiles}
        />
      </div>

      <div className="min-h-0 bg-[var(--editor-surface)]">
        {supportsPreview && contentView === "preview" ? (
          isMarkdown ? (
          <MarkdownPreview content={deferredContent} />
          ) : (
            <JsonPreview content={deferredContent} />
          )
        ) : supportsPreview && contentView === "split" ? (
          <div className="grid h-full min-h-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-h-0 border-b border-[var(--border)] xl:border-b-0 xl:border-r">
              {renderCodeEditor()}
            </div>
            <div className="min-h-0">
              {isMarkdown ? (
                <MarkdownPreview content={deferredContent} compact />
              ) : (
                <JsonPreview content={deferredContent} compact />
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
