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

function getSourceBadgeTone(source: SystemSkill["source"]) {
  if (source === "managed") {
    return "border-[rgba(79,168,199,0.16)] bg-[rgba(79,168,199,0.08)] text-[var(--cyan-strong)]";
  }

  if (source === "workspace") {
    return "border-[rgba(217,98,59,0.16)] bg-[rgba(217,98,59,0.08)] text-[var(--accent-strong)]";
  }

  return "border-[rgba(138,108,230,0.18)] bg-[rgba(138,108,230,0.08)] text-[var(--violet-strong)]";
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
          const isSkillsDirectory =
            node.kind === "directory" &&
            (node.name.toLowerCase() === "skill" || node.name.toLowerCase() === "skills");
          const isAutoExpandedDirectory = node.kind === "directory" && node.name.toLowerCase() === "skills";
          const isExpanded = isAutoExpandedDirectory || searchActive || expandedNodeIds.has(node.id);
          const isRoot = node.kind === "root";

          return (
            <div key={node.id} className="space-y-1.5">
              <button
                className={`flex w-full items-center rounded-[12px] border border-transparent font-medium text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
                  compact
                    ? isSkillsDirectory
                      ? "gap-2 px-2 py-2 text-[14px]"
                      : "gap-1.5 px-2 py-1.5 text-[13px]"
                    : isSkillsDirectory
                      ? "gap-2.5 px-2.5 py-2.5 text-[15px]"
                      : "gap-2 px-2.5 py-2 text-sm"
                }`}
                onClick={() => onToggleNode(node.id)}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
                title={node.path}
                type="button"
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
                    isRoot
                      ? "text-[var(--accent-strong)]"
                      : isSkillsDirectory
                        ? "text-[var(--cyan-strong)]"
                        : "text-[var(--violet)]"
                  } ${isSkillsDirectory ? "h-[18px] w-[18px]" : "h-4 w-4"
                  }`}
                >
                  <FolderNodeIcon expanded={isExpanded} name={node.name} path={node.path} root={isRoot} />
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
                className={`flex items-center gap-2 rounded-[12px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] text-left transition hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-[var(--text)] ${
                  compact ? "px-2 py-1.5 text-[13px]" : "px-2.5 py-2 text-sm"
                } text-[var(--muted)]`}
                style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
                title={skill.manifestPath}
              >
                <button
                  className="inline-flex shrink-0 h-4 w-4 items-center justify-center rounded-[6px] bg-white/[0.02] text-[var(--violet-strong)]"
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
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                      getSourceBadgeTone(skill.source)
                    }`}
                  >
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
              className={`flex w-full items-center gap-2 rounded-[11px] border border-transparent text-left transition text-[var(--muted)] hover:border-white/[0.04] hover:bg-white/[0.03] hover:text-[var(--text)] ${
                compact ? "px-2 py-1.5 text-[13px]" : "px-2.5 py-1.5 text-sm"
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
