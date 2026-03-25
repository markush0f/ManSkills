import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useDeferredValue, useEffect, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { getSaveShortcutLabel, matchesSaveShortcut } from "../../ide/utils";
import { WorkbenchTabsBar } from "../layout/WorkbenchTabsBar";
import { JsonPreview } from "./JsonPreview";
import { MarkdownPreview } from "./MarkdownPreview";
import { shellPanelClass } from "../shared/ui";

addCollection(codiconIcons);

export function EditorWorkspace() {
  const {
    activeFile,
    activeFileId,
    activeFileSaveError,
    closeFile,
    isSavingActiveFile,
    openFile,
    openFiles,
    preferences,
    saveActiveFile,
    updateActiveFile,
  } = useIde();
  const [contentView, setContentView] = useState<"preview" | "code" | "split">("code");
  const [draftContent, setDraftContent] = useState(activeFile.content);
  const isMarkdown = activeFile.language === "md";
  const isJson = activeFile.language === "json";
  const supportsPreview = isMarkdown || isJson;
  const deferredContent = useDeferredValue(draftContent);
  const canSaveActiveFile =
    Boolean(activeFile?.isWritable && activeFile.rootPath && activeFile.relativePath) &&
    activeFile.content !== activeFile.savedContent;
  const saveShortcutLabel = getSaveShortcutLabel(preferences.saveShortcut);

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || !canSaveActiveFile || isSavingActiveFile) {
        return;
      }

      if (!matchesSaveShortcut(event, preferences.saveShortcut)) {
        return;
      }

      event.preventDefault();
      void saveActiveFile(draftContent);
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [canSaveActiveFile, draftContent, isSavingActiveFile, preferences.saveShortcut, saveActiveFile]);

  function getMonacoLanguage() {
    if (activeFile.language === "md") return "markdown";
    if (activeFile.language === "ts") return "typescript";
    if (activeFile.language === "txt") return "plaintext";
    return "json";
  }

  function buildSaveKeybinding(monaco: typeof Monaco) {
    if (preferences.saveShortcut === "mod+shift+s") {
      return monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS;
    }

    if (preferences.saveShortcut === "alt+s") {
      return monaco.KeyMod.Alt | monaco.KeyCode.KeyS;
    }

    return monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS;
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
            editor.addCommand(buildSaveKeybinding(monaco), () => {
              if (!canSaveActiveFile || isSavingActiveFile) {
                return;
              }

              void saveActiveFile(editor.getValue());
            });
          }}
        />
      </div>
    );
  }

  return (
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden`}>
      <div className="flex min-w-0 items-center justify-between border-b border-[var(--border)] bg-[rgba(4,8,12,0.94)]">
        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkbenchTabsBar
            activeTabId={activeFileId}
            fileTabs={openFiles}
            onCloseTab={closeFile}
            onOpenTab={openFile}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 px-2">
          {activeFileSaveError && (
            <span className="max-w-[220px] truncate text-[11px] text-[#ffb3a7]">
              {activeFileSaveError}
            </span>
          )}
          {activeFile.isWritable && (
            <button
              className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-[12px] transition ${
                canSaveActiveFile && !isSavingActiveFile
                  ? "border-[var(--violet-border)] bg-[var(--violet-soft)] text-[var(--text)] hover:bg-[var(--violet-soft-strong)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
              disabled={!canSaveActiveFile || isSavingActiveFile}
              onClick={() => {
                void saveActiveFile(draftContent);
              }}
              type="button"
            >
              <Icon icon="codicon:save" className="h-3.5 w-3.5" />
              <span>{isSavingActiveFile ? "Saving" : "Save"}</span>
              {!isSavingActiveFile && (
                <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                  {saveShortcutLabel}
                </span>
              )}
            </button>
          )}
        </div>
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
