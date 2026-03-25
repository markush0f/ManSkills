import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { matchesSaveShortcut } from "../../ide/utils";
import type { IdeFile, SaveShortcut } from "../../types";
import { WorkbenchTabsBar } from "../layout/WorkbenchTabsBar";
import { JsonPreview } from "./JsonPreview";
import { MarkdownPreview } from "./MarkdownPreview";
import { shellPanelClass } from "../shared/ui";

addCollection(codiconIcons);

type ContentView = "preview" | "code" | "split";

const PREVIEW_MODES: Array<{ icon: string; label: string; mode: ContentView }> = [
  { icon: "codicon:code", label: "Code", mode: "code" },
  { icon: "codicon:open-preview", label: "Preview", mode: "preview" },
  { icon: "codicon:split-horizontal", label: "Split", mode: "split" },
];

function getMonacoLanguage(language: IdeFile["language"]) {
  if (language === "md") return "markdown";
  if (language === "ts") return "typescript";
  if (language === "txt") return "plaintext";
  return "json";
}

function buildSaveKeybinding(shortcut: SaveShortcut, monaco: typeof Monaco) {
  if (shortcut === "mod+shift+s") {
    return monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS;
  }

  if (shortcut === "alt+s") {
    return monaco.KeyMod.Alt | monaco.KeyCode.KeyS;
  }

  return monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS;
}

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
  const [contentView, setContentView] = useState<ContentView>("code");
  const [draftContent, setDraftContent] = useState(activeFile.content);
  const isMarkdown = activeFile.language === "md";
  const isJson = activeFile.language === "json";
  const supportsPreview = isMarkdown || isJson;
  const deferredContent = useDeferredValue(draftContent);
  const canSaveActiveFile =
    Boolean(activeFile?.isWritable && activeFile.rootPath && activeFile.relativePath) &&
    activeFile.content !== activeFile.savedContent;

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

  const handleWindowSaveShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || !canSaveActiveFile || isSavingActiveFile) {
      return;
    }

    if (!matchesSaveShortcut(event, preferences.saveShortcut)) {
      return;
    }

    event.preventDefault();
    void saveActiveFile(draftContent);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      handleWindowSaveShortcut(event);
    };

    window.addEventListener("keydown", listener, { capture: true });

    return () => {
      window.removeEventListener("keydown", listener, { capture: true });
    };
  }, []);

  function renderPreviewModeButton(
    mode: "code" | "preview" | "split",
    label: string,
    icon: string,
  ) {
    const isActive = contentView === mode;

    return (
      <button
        className={`inline-flex h-7 items-center rounded-[7px] border px-2.5 text-[11px] transition ${
          isActive
            ? "border-[var(--violet-border)] bg-[var(--violet-soft)] text-[var(--text)]"
            : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/[0.03] hover:text-[var(--text)]"
        }`}
        onClick={() => setContentView(mode)}
        title={label}
        type="button"
      >
        <Icon icon={icon} className="h-3.5 w-3.5" />
      </button>
    );
  }

  function renderCodeEditor() {
    return (
      <div className="h-full min-h-0 bg-[var(--editor-surface)]">
        <Editor
          height="100%"
          language={getMonacoLanguage(activeFile.language)}
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
            editor.addCommand(buildSaveKeybinding(preferences.saveShortcut, monaco), () => {
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
      <div className="flex min-w-0 items-center justify-between border-b border-[var(--border)] bg-[image:var(--topbar-bg)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkbenchTabsBar
            activeTabId={activeFileId}
            fileTabs={openFiles}
            onCloseTab={closeFile}
            onOpenTab={openFile}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 px-2">
          {supportsPreview && (
            <div className="flex items-center gap-1 rounded-[9px] border border-white/[0.04] bg-white/[0.02] p-1">
              {PREVIEW_MODES.map(({ icon, label, mode }) =>
                renderPreviewModeButton(mode, label, icon),
              )}
            </div>
          )}
          {activeFileSaveError && (
            <span className="max-w-[220px] truncate text-[11px] text-[#ffb3a7]">
              {activeFileSaveError}
            </span>
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
