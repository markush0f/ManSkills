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
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text)]"
                style={{ paddingLeft: 12 + depth * 16 }}
              >
                <span className="text-[var(--accent)]">/</span>
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
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
              isActive
                ? "bg-[var(--accent-soft)] text-[var(--text)]"
                : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
            }`}
            onClick={() => onOpenFile(node.fileId)}
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]/80" />
            <span className="truncate">{getFileName(file?.path ?? node.name)}</span>
          </button>
        );
      })}
    </>
  );
}

export function Sidebar({ activeFileId, files, tree, onOpenFile }: SidebarProps) {
  return (
    <aside className={`${shellPanelClass} p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <p className={panelHeaderTitleClass}>Archivos</p>
        <span className="text-xs text-[var(--muted)]">{files.length}</span>
      </div>

      <div className="space-y-2">
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
