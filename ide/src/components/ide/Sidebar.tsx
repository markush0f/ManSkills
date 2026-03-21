import type { IdeFile, TreeNode } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { panelHeaderTitleClass, shellPanelClass } from "./ui";

type SidebarProps = {
  activeFileId: string;
  files: IdeFile[];
  tree: TreeNode[];
  onOpenFile: (fileId: string) => void;
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

export function Sidebar({ activeFileId, files, tree, onOpenFile }: SidebarProps) {
  return (
    <aside className={`${shellPanelClass} flex min-h-[calc(100vh-48px)] flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.96),rgba(12,20,27,0.86))]`}>
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4f8f89]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
        </div>
        <div className="flex items-center justify-between">
          <p className={panelHeaderTitleClass}>Workspace</p>
          <span className="text-xs text-[var(--muted)]">{files.length} files</span>
        </div>
        <strong className="mt-2 block text-sm font-medium text-[var(--text)]">forja-studio</strong>
        <p className="mt-1 text-xs text-[var(--muted)]">Estructura del proyecto</p>
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
