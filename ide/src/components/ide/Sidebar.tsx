import type { IdeFile, TreeNode } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { panelHeaderTitleClass, shellPanelClass } from "./ui";

type SidebarProps = {
  activeFileId: string;
  files: IdeFile[];
  isMarketplaceView: boolean;
  onOpenFile: (fileId: string) => void;
  onOpenMarketplace: () => void;
  tree: TreeNode[];
};

function TreeList({
  activeFileId,
  files,
  nodes,
  onOpenFile,
  depth = 0,
}: {
  activeFileId: string;
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
                className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--text)]"
                style={{ paddingLeft: 12 + depth * 16 }}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] bg-white/5 font-mono text-[10px] text-[var(--accent)]">
                  +
                </span>
                <span>{node.name}</span>
              </div>
              <div className="space-y-1">
                <TreeList
                  activeFileId={activeFileId}
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
            className={`flex w-full items-center gap-2 rounded-[10px] border border-transparent px-3 py-2 text-left text-sm transition ${
              isActive
                ? "border-[var(--border)] bg-white/8 text-[var(--text)]"
                : "text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/5 hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenFile(node.fileId)}
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] bg-black/10 font-mono text-[10px] text-[var(--muted)]">
              {file?.language.toUpperCase().slice(0, 2)}
            </span>
            <span className="truncate">{getFileName(file?.path ?? node.name)}</span>
          </button>
        );
      })}
    </>
  );
}

export function Sidebar({
  activeFileId,
  files,
  isMarketplaceView,
  onOpenFile,
  onOpenMarketplace,
  tree,
}: SidebarProps) {
  const skillCount = tree.filter((node) => node.kind === "folder").length;

  return (
    <aside
      className={`${shellPanelClass} flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.96),rgba(12,20,27,0.86))]`}
    >
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={panelHeaderTitleClass}>AI Skills Management</p>
            <strong className="mt-2 block text-sm font-medium text-[var(--text)]">Installed Skills</strong>
            <p className="mt-1 text-xs text-[var(--muted)]">Manifests, prompts and configuration files</p>
          </div>

          <button
            aria-label="Marketplace"
            className={`shrink-0 rounded-[10px] border px-3 py-2 text-xs font-medium transition ${
              isMarketplaceView
                ? "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-white/6 text-[var(--text)] hover:border-[var(--border-strong)]"
            }`}
            onClick={onOpenMarketplace}
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

        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <span>{skillCount} skills</span>
          <span>Explorer</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-3">
        <TreeList
          activeFileId={activeFileId}
          files={files}
          nodes={tree}
          onOpenFile={onOpenFile}
        />
      </div>
    </aside>
  );
}
