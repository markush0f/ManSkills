import type { IdeFile, TreeNode } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { panelHeaderTitleClass, shellPanelClass } from "../shared/ui";

function getFileTone(language?: IdeFile["language"]) {
  if (language === "md") {
    return "border-[#d79432]/25 bg-[#d79432]/10 text-[#ffd08b]";
  }

  if (language === "json") {
    return "border-[#4f8f89]/25 bg-[#4f8f89]/10 text-[#9dd8d1]";
  }

  return "border-[var(--border)] bg-white/5 text-[var(--muted)]";
}

function getFileBadgeLabel(language?: IdeFile["language"]) {
  if (language === "json") {
    return "{}";
  }

  if (language === "md") {
    return "MD";
  }

  return language?.toUpperCase().slice(0, 2) ?? "--";
}

function TreeList({
  activeFileId,
  files,
  nodes,
  onOpenFile,
  compact,
  depth = 0,
}: {
  activeFileId: string;
  compact: boolean;
  files: IdeFile[];
  nodes: TreeNode[];
  onOpenFile: (fileId: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === "folder") {
          return (
            <div key={node.path} className="space-y-1.5">
              <div
                className={`flex items-center rounded-[10px] font-medium text-[var(--text)] ${
                  compact ? "gap-1.5 px-2 py-1.5 text-[13px]" : "gap-2 px-3 py-2 text-sm"
                }`}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
              >
                <span
                  className={`inline-flex items-center justify-center rounded border border-[var(--border)] bg-white/5 font-mono text-[10px] text-[var(--accent)] ${
                    compact ? "h-4 w-4" : "h-5 w-5"
                  }`}
                >
                  +
                </span>
                <span className="truncate">{node.name}</span>
              </div>
              <div className="space-y-1">
                <TreeList
                  activeFileId={activeFileId}
                  compact={compact}
                  depth={depth + 1}
                  files={files}
                  nodes={node.children}
                  onOpenFile={onOpenFile}
                />
              </div>
            </div>
          );
        }

        const file = files.find((entry) => entry.id === node.fileId);
        const isActive = activeFileId === node.fileId;

        return (
          <button
            key={node.path}
            className={`flex w-full items-center rounded-[10px] border border-transparent text-left transition ${
              isActive
                ? "border-[var(--border-strong)] bg-[linear-gradient(90deg,rgba(217,98,59,0.16),rgba(255,255,255,0.08))] text-[var(--text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                : "text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/5 hover:text-[var(--text)]"
            } ${compact ? "gap-1.5 px-2 py-1.5 text-[13px]" : "gap-2 px-3 py-2 text-sm"}`}
            onClick={() => onOpenFile(node.fileId)}
            style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
          >
            <span
              className={`inline-flex items-center justify-center rounded border font-mono text-[10px] ${
                isActive ? "border-white/20 bg-black/20 text-white" : getFileTone(file?.language)
              } ${
                compact ? "h-4 w-4" : "h-5 w-5"
              }`}
            >
              {getFileBadgeLabel(file?.language)}
            </span>
            <span className="truncate">{getFileName(file?.path ?? node.name)}</span>
          </button>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const { activeFileId, files, isMarketplaceView, openFile, openMarketplace, tree } = useIde();
  const { isSidebarCompact: compact } = useIdeLayout();
  const skillCount = tree.filter((node) => node.kind === "folder").length;

  return (
    <aside
      className={`${shellPanelClass} flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.96),rgba(12,20,27,0.86))]`}
    >
      <div className={`border-b border-[var(--border)] ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
        <div className={`flex items-start justify-between ${compact ? "gap-2" : "gap-3"}`}>
          <div className="min-w-0">
            <p className={panelHeaderTitleClass}>{compact ? "AI Skills" : "AI Skills Management"}</p>
            <strong className={`block font-medium text-[var(--text)] ${compact ? "mt-1 text-[13px]" : "mt-2 text-sm"}`}>
              Installed Skills
            </strong>
            {!compact && (
              <p className="mt-1 text-xs text-[var(--muted)]">Manifests, prompts and configuration files</p>
            )}
          </div>

          <button
            aria-label="Marketplace"
            className={`shrink-0 rounded-[10px] border transition ${
              isMarketplaceView
                ? "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-white/6 text-[var(--text)] hover:border-[var(--border-strong)]"
            } ${compact ? "px-2.5 py-2" : "px-3 py-2 text-xs font-medium"}`}
            onClick={openMarketplace}
            title="Marketplace"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 5.5h11M4 5.5V4.75A1.75 1.75 0 0 1 5.75 3h4.5A1.75 1.75 0 0 1 12 4.75v.75M3.75 5.5h8.5v6.75A.75.75 0 0 1 11.5 13h-7a.75.75 0 0 1-.75-.75V5.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.2"
              />
            </svg>
          </button>
        </div>

        <div className={`flex items-center justify-between border-t border-[var(--border)] text-xs text-[var(--muted)] ${compact ? "mt-3 pt-2" : "mt-4 pt-3"}`}>
          <span>{skillCount} skills</span>
          {!compact && <span>Explorer</span>}
        </div>
      </div>

      <div className={`flex-1 overflow-auto ${compact ? "px-2 py-2" : "px-3 py-3"}`}>
        <TreeList
          activeFileId={activeFileId}
          compact={compact}
          files={files}
          nodes={tree}
          onOpenFile={openFile}
        />
      </div>
    </aside>
  );
}
