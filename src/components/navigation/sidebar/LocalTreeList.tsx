import type { IdeFile, TreeNode } from "../../../types";
import { getFileName } from "../../../ide/utils";
import { ExpandIcon, FileNodeIcon, FolderNodeIcon } from "./SidebarTreeIcons";

function getLocalFileIconTone(language?: IdeFile["language"], active?: boolean) {
  if (language === "md") {
    return active ? "text-[var(--accent-strong)]" : "text-[var(--accent)]";
  }

  if (language === "json") {
    return active ? "text-[var(--cyan-strong)]" : "text-[var(--cyan)]";
  }

  if (language === "ts") {
    return active ? "text-[var(--violet-strong)]" : "text-[var(--violet)]";
  }

  return active ? "text-[var(--text)]" : "text-[var(--muted)]";
}

type LocalTreeListProps = {
  activeFileId: string;
  compact: boolean;
  depth?: number;
  fileById: ReadonlyMap<string, IdeFile>;
  nodes: TreeNode[];
  onOpenFile: (fileId: string) => void;
};

export function LocalTreeList({
  activeFileId,
  compact,
  depth = 0,
  fileById,
  nodes,
  onOpenFile,
}: LocalTreeListProps) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === "folder") {
          const isSkillsDirectory = node.name.toLowerCase() === "skill" || node.name.toLowerCase() === "skills";
          const isExpanded = true;

          return (
            <div key={node.path} className="space-y-1.5">
              <div
                className={`flex items-center rounded-[12px] border border-transparent font-medium text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
                  compact
                    ? isSkillsDirectory
                      ? "gap-2 px-2 py-2 text-[14px]"
                      : "gap-1.5 px-2 py-1.5 text-[13px]"
                    : isSkillsDirectory
                      ? "gap-2.5 px-2.5 py-2.5 text-[15px]"
                      : "gap-2 px-2.5 py-2 text-sm"
                }`}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-[6px] bg-white/[0.02] text-[var(--violet-strong)] ${
                    isSkillsDirectory ? "h-[18px] w-[18px]" : "h-4 w-4"
                  }`}
                >
                  <ExpandIcon expanded={isExpanded} />
                </span>
                <span
                  className={`inline-flex items-center justify-center rounded-[6px] ${
                    isSkillsDirectory ? "text-[var(--cyan-strong)]" : "text-[var(--accent)]"
                  } ${
                    isSkillsDirectory ? "h-[18px] w-[18px]" : "h-4 w-4"
                  }`}
                >
                  <FolderNodeIcon expanded={isExpanded} name={node.name} path={node.path} />
                </span>
                <span className="truncate">{node.name}</span>
              </div>
              <div className="space-y-1">
                <LocalTreeList
                  activeFileId={activeFileId}
                  compact={compact}
                  depth={depth + 1}
                  fileById={fileById}
                  nodes={node.children}
                  onOpenFile={onOpenFile}
                />
              </div>
            </div>
          );
        }

        const file = fileById.get(node.fileId);
        const isActive = activeFileId === node.fileId;

        return (
          <button
            key={node.path}
            className={`flex w-full items-center rounded-[10px] border border-transparent text-left transition ${
              isActive
                ? "border-[var(--violet-border)] bg-[linear-gradient(90deg,rgba(138,108,230,0.18),rgba(255,255,255,0.05))] text-[var(--text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                : "text-[var(--muted)] hover:border-white/[0.04] hover:bg-white/[0.03] hover:text-[var(--text)]"
            } ${compact ? "gap-1.5 px-2 py-1.5 text-[13px]" : "gap-2 px-2.5 py-1.5 text-sm"}`}
            onClick={() => onOpenFile(node.fileId)}
            style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center ${getLocalFileIconTone(
                file?.language,
                isActive,
              )}`}
            >
              <FileNodeIcon language={file?.language} />
            </span>
            <span className="truncate">{getFileName(file?.path ?? node.name)}</span>
          </button>
        );
      })}
    </>
  );
}
