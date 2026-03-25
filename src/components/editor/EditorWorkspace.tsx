import Editor from "@monaco-editor/react";
import { useDeferredValue, useEffect, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { WorkbenchTabsBar } from "../layout/WorkbenchTabsBar";
import { JsonPreview } from "./JsonPreview";
import { MarkdownPreview } from "./MarkdownPreview";
import { shellPanelClass } from "../shared/ui";

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
            bracketPairColorization: { enabled: preferences.bracketPairGuides },
            cursorBlinking: preferences.cursorAnimation ? "smooth" : "blink",
            cursorSmoothCaretAnimation: preferences.cursorAnimation ? "on" : "off",
            cursorStyle: preferences.cursorStyle,
            fontFamily: "Fira Code, Cascadia Code, Cascadia Mono, Consolas, SFMono-Regular, monospace",
            fontLigatures: preferences.fontLigatures,
            fontSize: preferences.fontSize,
            guides: {
              bracketPairs: preferences.bracketPairGuides,
              indentation: true,
            },
            lineHeight: preferences.lineHeight,
            lineNumbers: preferences.lineNumbers,
            minimap: { enabled: preferences.minimap },
            padding: { top: 20, bottom: 20 },
            renderLineHighlight: preferences.highlightActiveLine ? "line" : "none",
            renderWhitespace: preferences.renderWhitespace,
            roundedSelection: false,
            scrollBeyondLastLine: preferences.scrollBeyondLastLine,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
              horizontalScrollbarSize: 10,
              verticalScrollbarSize: 10,
            },
            smoothScrolling: preferences.smoothScrolling,
            tabSize: preferences.tabSize,
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
                "editorCursor.foreground": "#a78bfa",
                "editor.selectionBackground": "#8a6ce633",
                "editor.inactiveSelectionBackground": "#8a6ce61f",
                "editor.lineHighlightBackground": "#120f1d",
                "editor.lineHighlightBorder": "#8a6ce629",
                "editorWidget.background": "#091018",
                "editorLineNumber.foreground": "#62707f",
                "editorLineNumber.activeForeground": "#c6b8ff",
                "editorGutter.background": "#091119",
                "editorIndentGuide.background1": "#141d27",
                "editorIndentGuide.activeBackground1": "#46356f",
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
        <WorkbenchTabsBar
          activeTabId={activeFileId}
          fileTabs={openFiles}
          onCloseTab={closeFile}
          onOpenTab={openFile}
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
