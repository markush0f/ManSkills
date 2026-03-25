import type { IdeFile, TreeNode } from "../../../types";
import { getFileName } from "../../../ide/utils";
import { ExpandIcon, FileNodeIcon, FolderNodeIcon } from "./SidebarTreeIcons";

type LocalTreeListProps = {
  activeFileId: string;
  compact: boolean;
  depth?: number;
  files: IdeFile[];
  nodes: TreeNode[];
  onOpenFile: (fileId: string) => void;
};

export function LocalTreeList({
  activeFileId,
  compact,
  depth = 0,
  files,
  nodes,
  onOpenFile,
}: LocalTreeListProps) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === "folder") {
          const isExpanded = true;

          return (
            <div key={node.path} className="space-y-1.5">
              <div
                className={`flex items-center rounded-[10px] font-medium text-[var(--text)] ${
                  compact ? "gap-1.5 px-2 py-1.5 text-[13px]" : "gap-2 px-3 py-2 text-sm"
                }`}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--violet-strong)]">
                  <ExpandIcon expanded={isExpanded} />
                </span>
                <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--muted)]">
                  <FolderNodeIcon expanded={isExpanded} />
                </span>
                <span className="truncate">{node.name}</span>
              </div>
              <div className="space-y-1">
                <LocalTreeList
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
                ? "border-[var(--violet-border)] bg-[linear-gradient(90deg,rgba(138,108,230,0.16),rgba(255,255,255,0.06))] text-[var(--text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                : "text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/5 hover:text-[var(--text)]"
            } ${compact ? "gap-1.5 px-2 py-1.5 text-[13px]" : "gap-2 px-3 py-2 text-sm"}`}
            onClick={() => onOpenFile(node.fileId)}
            style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--muted)]">
              <FileNodeIcon language={file?.language} />
            </span>
            <span className="truncate">{getFileName(file?.path ?? node.name)}</span>
          </button>
        );
      })}
    </>
  );
}
