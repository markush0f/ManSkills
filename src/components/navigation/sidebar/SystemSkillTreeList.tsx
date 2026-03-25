import type { SystemSkill, SystemSkillTreeNode } from "../../../types";
import {
  getSystemSkillSourceLabel,
} from "./sidebarTreeUtils";
import { ExpandIcon, FileNodeIcon, FolderNodeIcon, SkillNodeIcon } from "./SidebarTreeIcons";

function getSystemFileIconTone(language?: NonNullable<SystemSkillTreeNode["file"]>["language"]) {
  if (language === "md") {
    return "text-[var(--accent)]";
  }

  if (language === "json") {
    return "text-[var(--cyan)]";
  }

  if (language === "ts") {
    return "text-[var(--violet)]";
  }

  return "text-[var(--muted)]";
}

type SystemSkillTreeListProps = {
  compact: boolean;
  currentSkill?: SystemSkill;
  depth?: number;
  expandedNodeIds: Set<string>;
  nodes: SystemSkillTreeNode[];
  onOpenSkill: (skill: SystemSkill) => void;
  onOpenSkillFile: (skill: SystemSkill, relativePath: string) => void;
  onToggleNode: (nodeId: string) => void;
  openingSkillId: string | null;
  searchActive: boolean;
};

export function SystemSkillTreeList({
  compact,
  currentSkill,
  depth = 0,
  expandedNodeIds,
  nodes,
  onOpenSkill,
  onOpenSkillFile,
  onToggleNode,
  openingSkillId,
  searchActive,
}: SystemSkillTreeListProps) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === "root" || node.kind === "directory") {
          const isExpanded = searchActive || expandedNodeIds.has(node.id);
          const isRoot = node.kind === "root";

          return (
            <div key={node.id} className="space-y-1.5">
              <button
                className={`flex w-full items-center rounded-[10px] font-medium text-[var(--text)] transition hover:bg-white/5 ${
                  compact ? "gap-1.5 px-2 py-1.5 text-[13px]" : "gap-2 px-3 py-2 text-sm"
                }`}
                onClick={() => onToggleNode(node.id)}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
                title={node.path}
                type="button"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--violet-strong)]">
                  <ExpandIcon expanded={isExpanded} />
                </span>
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center ${
                    isRoot ? "text-[var(--accent-strong)]" : "text-[var(--violet)]"
                  }`}
                >
                  <FolderNodeIcon expanded={isExpanded} root={isRoot} />
                </span>
                <span className="truncate">{node.name}</span>
              </button>
              {isExpanded && (
                <div className="space-y-1">
                  <SystemSkillTreeList
                    compact={compact}
                    currentSkill={currentSkill}
                    depth={depth + 1}
                    expandedNodeIds={expandedNodeIds}
                    nodes={node.children}
                    onOpenSkill={onOpenSkill}
                    onOpenSkillFile={onOpenSkillFile}
                    onToggleNode={onToggleNode}
                    openingSkillId={openingSkillId}
                    searchActive={searchActive}
                  />
                </div>
              )}
            </div>
          );
        }

        if (node.kind === "skill") {
          const skill = node.skill;

          if (!skill) {
            return null;
          }

          const isExpanded = searchActive || expandedNodeIds.has(node.id);

          return (
            <div key={node.id} className="space-y-1.5">
              <div
                className={`flex items-center gap-2 rounded-[10px] border border-transparent text-left transition hover:border-[var(--border)] hover:bg-white/5 hover:text-[var(--text)] ${
                  compact ? "px-2 py-1.5 text-[13px]" : "px-3 py-2 text-sm"
                } text-[var(--muted)]`}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
                title={skill.manifestPath}
              >
                <button
                  className="inline-flex shrink-0 h-4 w-4 items-center justify-center text-[var(--violet-strong)]"
                  onClick={() => onToggleNode(node.id)}
                  type="button"
                >
                  <ExpandIcon expanded={isExpanded} />
                </button>
                <button
                  className="flex min-w-0 flex-1 items-center justify-between gap-2"
                  onClick={() => onOpenSkill(skill)}
                  type="button"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[var(--accent-strong)]">
                      <SkillNodeIcon />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[var(--text)]">{node.name}</p>
                      {!compact && <p className="truncate text-[10px] text-[var(--muted)]">{skill.rootPath}</p>}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--border)] bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    {openingSkillId === skill.id ? "Loading" : getSystemSkillSourceLabel(skill.source)}
                  </span>
                </button>
              </div>
              {isExpanded && (
                <div className="space-y-1">
                  <SystemSkillTreeList
                    compact={compact}
                    currentSkill={skill}
                    depth={depth + 1}
                    expandedNodeIds={expandedNodeIds}
                    nodes={node.children}
                    onOpenSkill={onOpenSkill}
                    onOpenSkillFile={onOpenSkillFile}
                    onToggleNode={onToggleNode}
                    openingSkillId={openingSkillId}
                    searchActive={searchActive}
                  />
                </div>
              )}
            </div>
          );
        }

        if (node.kind === "file") {
          const file = node.file;

          if (!file || !currentSkill) {
            return null;
          }

          return (
            <button
              key={node.id}
              className={`flex w-full items-center gap-2 rounded-[10px] border border-transparent text-left transition text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/5 hover:text-[var(--text)] ${
                compact ? "px-2 py-1.5 text-[13px]" : "px-3 py-2 text-sm"
              }`}
              onClick={() => onOpenSkillFile(currentSkill, file.relativePath)}
              style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
              title={file.relativePath}
              type="button"
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center ${getSystemFileIconTone(
                  file.language,
                )}`}
              >
                <FileNodeIcon language={file.language} />
              </span>
              <span className="truncate text-[var(--text)]">{node.name}</span>
            </button>
          );
        }

        return null;
      })}
    </>
  );
}
