import { CodeIcon } from "@phosphor-icons/react/dist/csr/Code";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { SplitHorizontalIcon } from "@phosphor-icons/react/dist/csr/SplitHorizontal";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useIde } from "../../contexts/IdeContext";
import { useEditorSession } from "../../hooks/useEditorSession";
import type { IdeFile, SaveShortcut } from "../../types";
import { WorkbenchTabsBar } from "../layout/WorkbenchTabsBar";
import { EmptyState } from "../shared/EmptyState";
import { accentButtonClass, ghostButtonClass, shellPanelClass } from "../shared/ui";
import { JsonPreview } from "./JsonPreview";
import { MarkdownPreview } from "./MarkdownPreview";

type ContentView = "preview" | "code" | "split";

const PREVIEW_MODES: Array<{ label: string; mode: ContentView }> = [
  { label: "Code", mode: "code" },
  { label: "Preview", mode: "preview" },
  { label: "Split", mode: "split" },
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

function PreviewModeIcon({
  isActive,
  mode,
}: {
  isActive: boolean;
  mode: ContentView;
}) {
  const iconClassName = "h-[18px] w-[18px]";
  const weight = isActive ? "fill" : "regular";

  if (mode === "code") {
    return <CodeIcon className={iconClassName} weight={weight} />;
  }

  if (mode === "preview") {
    return <EyeIcon className={iconClassName} weight={weight} />;
  }

  return <SplitHorizontalIcon className={iconClassName} weight={weight} />;
}

export function EditorWorkspace() {
  const {
    activeFile,
    activeFileId,
    closeFile,
    isSavingActiveFile,
    openFile,
    openMarketplace,
    openSettings,
    openFiles,
    preferences,
    saveActiveFile,
    updateActiveFile,
  } = useIde();
  const {
    canSaveActiveFile,
    contentView,
    deferredContent,
    draftContent,
    isMarkdown,
    previewRailWidth,
    saveStatusWidth,
    selectContentView,
    setDraftContent,
    supportsPreview,
  } = useEditorSession({
    activeFile,
    isSavingActiveFile,
    preferences,
    saveActiveFile,
    updateActiveFile,
  });

  function renderPreviewModeButton(
    mode: "code" | "preview" | "split",
    label: string,
  ) {
    const isActive = contentView === mode;

    return (
      <button
        aria-label={label}
        className={`relative inline-flex h-full min-w-0 items-center justify-center text-[11px] transition-colors ${
          isActive
            ? "bg-white/[0.018] text-[var(--text)]"
            : "text-[var(--muted)] hover:bg-white/[0.01] hover:text-[var(--text)]"
        }`}
        onClick={() => selectContentView(mode)}
        title={label}
        type="button"
      >
        {isActive && (
          <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--accent)]" />
        )}
        <PreviewModeIcon isActive={isActive} mode={mode} />
      </button>
    );
  }

  function renderCodeEditor() {
    if (!activeFile) {
      return null;
    }

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
                "editor.background": "#0b1520",
                "editorCursor.foreground": "#a78bfa",
                "editor.selectionBackground": "#8a6ce633",
                "editor.inactiveSelectionBackground": "#8a6ce61f",
                "editor.lineHighlightBackground": "#111c28",
                "editor.lineHighlightBorder": "#8a6ce629",
                "editorWidget.background": "#0e1823",
                "editorLineNumber.foreground": "#7a889a",
                "editorLineNumber.activeForeground": "#c6b8ff",
                "editorGutter.background": "#0b1520",
                "editorIndentGuide.background1": "#1b2632",
                "editorIndentGuide.activeBackground1": "#584592",
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
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[image:var(--editor-bg)]`}>
      <div className="relative h-[var(--app-header-height)] min-w-0 border-b border-[var(--border)] bg-[image:var(--topbar-bg)] shadow-[var(--topbar-shadow)]">
        <div
          className="h-full min-w-0 overflow-hidden"
          style={{
            paddingRight: `${previewRailWidth + saveStatusWidth}px`,
          }}
        >
          <WorkbenchTabsBar
            activeTabId={activeFileId}
            fileTabs={openFiles}
            onCloseTab={closeFile}
            onOpenTab={openFile}
          />
        </div>
        {activeFile && supportsPreview && (
          <div
            className="absolute right-0 top-0 z-[2] grid h-full w-[126px] grid-cols-3 border-l border-[var(--border)] bg-[image:var(--topbar-bg)]"
            style={{ right: `${isSavingActiveFile ? `${saveStatusWidth}px` : "0px"}` }}
          >
            {PREVIEW_MODES.map(({ label, mode }) => renderPreviewModeButton(mode, label))}
          </div>
        )}
        {isSavingActiveFile && (
          <div className="absolute right-0 top-0 z-[2] flex h-full w-[148px] items-center border-l border-[var(--border)] bg-[image:var(--topbar-bg)] px-3">
            <span className="max-w-[120px] truncate text-[11px] text-[var(--cyan-strong)]">
              Saving...
            </span>
          </div>
        )}
      </div>

      <div className="min-h-0 bg-[var(--editor-surface)]">
        {!activeFile ? (
          <div className="grid h-full place-items-center p-6">
            <div className="w-full max-w-[560px]">
              <EmptyState
                action={
                  <div className="flex flex-wrap gap-3">
                    <button className={accentButtonClass} onClick={openMarketplace} type="button">
                      Open marketplace
                    </button>
                    <button className={ghostButtonClass} onClick={openSettings} type="button">
                      Open settings
                    </button>
                  </div>
                }
                eyebrow="Workspace Ready"
                message="Open a system skill from the sidebar to load real files into the workspace, or browse the marketplace to install a new skill."
                title="No file is open"
              />
            </div>
          </div>
        ) : supportsPreview && contentView === "preview" ? (
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
