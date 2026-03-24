import { useState } from "react";

import type { IdeFile, SystemSkill, SystemSkillTreeNode, TreeNode } from "../../ide/types";
import { getFileName } from "../../ide/utils";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { shellPanelClass } from "../shared/ui";

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

function getSystemSkillSourceLabel(source: SystemSkill["source"]) {
  if (source === "managed") {
    return "Managed";
  }

  if (source === "workspace") {
    return "Workspace";
  }

  return "System";
}

function SystemSkillTreeList({
  compact,
  depth = 0,
  expandedNodeIds,
  nodes,
  currentSkill,
  onOpenSkill,
  onOpenSkillFile,
  openingSkillId,
  onToggleNode,
}: {
  compact: boolean;
  expandedNodeIds: Set<string>;
  nodes: SystemSkillTreeNode[];
  currentSkill?: SystemSkill;
  onOpenSkill: (skill: SystemSkill) => void;
  onOpenSkillFile: (skill: SystemSkill, relativePath: string) => void;
  openingSkillId: string | null;
  onToggleNode: (nodeId: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === "root" || node.kind === "directory") {
          const isExpanded = expandedNodeIds.has(node.id);

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
                <span
                  className={`inline-flex items-center justify-center rounded border border-[var(--border)] bg-white/5 font-mono text-[10px] text-[var(--accent)] ${
                    compact ? "h-4 w-4" : "h-5 w-5"
                  }`}
                >
                  {isExpanded ? "-" : "+"}
                </span>
                <span className="truncate">{node.name}</span>
              </button>
              {isExpanded && (
                <div className="space-y-1">
                  <SystemSkillTreeList
                    compact={compact}
                    depth={depth + 1}
                    expandedNodeIds={expandedNodeIds}
                    nodes={node.children}
                    currentSkill={currentSkill}
                    onOpenSkill={onOpenSkill}
                    onOpenSkillFile={onOpenSkillFile}
                    openingSkillId={openingSkillId}
                    onToggleNode={onToggleNode}
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

          const isExpanded = expandedNodeIds.has(node.id);

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
                  className={`inline-flex shrink-0 items-center justify-center rounded border border-[var(--border)] bg-white/5 font-mono text-[10px] text-[var(--accent)] ${
                    compact ? "h-4 w-4" : "h-5 w-5"
                  }`}
                  onClick={() => onToggleNode(node.id)}
                  type="button"
                >
                  {isExpanded ? "-" : "+"}
                </button>
                <button
                  className="flex min-w-0 flex-1 items-center justify-between gap-2"
                  onClick={() => onOpenSkill(skill)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[var(--text)]">{node.name}</p>
                    {!compact && <p className="truncate text-[10px] text-[var(--muted)]">{skill.rootPath}</p>}
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
                    openingSkillId={openingSkillId}
                    onToggleNode={onToggleNode}
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
                className={`inline-flex items-center justify-center rounded border font-mono text-[10px] ${
                  getFileTone(file.language)
                } ${compact ? "h-4 w-4" : "h-5 w-5"}`}
              >
                {getFileBadgeLabel(file.language)}
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

export function Sidebar() {
  const {
    activeFileId,
    files,
    openFile,
    openSystemSkill,
    openSystemSkillFile,
    openingSystemSkillId,
    systemSkillsError,
    systemSkillsLoading,
    systemSkillTree,
    tree,
  } = useIde();
  const { isSidebarCompact: compact } = useIdeLayout();
  const [expandedSystemSkillNodeIds, setExpandedSystemSkillNodeIds] = useState<Set<string>>(() => new Set());
  const hasSystemSkillTree = !systemSkillsLoading && !systemSkillsError;

  function toggleSystemSkillNode(nodeId: string) {
    setExpandedSystemSkillNodeIds((current) => {
      const next = new Set(current);

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  }

  return (
    <aside
      className={`${shellPanelClass} flex h-full min-h-0 flex-col overflow-hidden text-[13px]`}
    >
      <div className={`flex-1 overflow-auto ${compact ? "px-2 py-2" : "px-2 py-2"}`}>
        <div className="space-y-4">
          {hasSystemSkillTree ? (
            systemSkillTree.length > 0 ? (
              <SystemSkillTreeList
                compact={compact}
                expandedNodeIds={expandedSystemSkillNodeIds}
                nodes={systemSkillTree}
                onOpenSkill={openSystemSkill}
                onOpenSkillFile={openSystemSkillFile}
                openingSkillId={openingSystemSkillId}
                onToggleNode={toggleSystemSkillNode}
              />
            ) : (
              <p className="text-xs text-[var(--muted)]">No se encontraron skills con manifiesto `SKILL.md`.</p>
            )
          ) : (
            <TreeList
              activeFileId={activeFileId}
              compact={compact}
              files={files}
              nodes={tree}
              onOpenFile={openFile}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
