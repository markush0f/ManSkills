import { useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import type { SystemSkill } from "../../../types";
import { ContextMenu } from "../../shared/ContextMenu";
import { ExpandIcon, FolderNodeIcon, SkillNodeIcon } from "./SidebarTreeIcons";
import { getPathLeafName, type ProviderSkillFolderGroup, type ProviderSkillGroup } from "./sidebarTreeUtils";

type ProviderSkillListProps = {
  compact: boolean;
  groups: ProviderSkillGroup[];
  hiddenDirectoryNames: string[];
  onHideDirectory: (directoryName: string) => Promise<unknown>;
  onOpenSkill: (skill: SystemSkill) => void;
  onShowDirectory: (directoryName: string) => Promise<unknown>;
  searchActive: boolean;
};

export function ProviderSkillList({
  compact,
  groups,
  hiddenDirectoryNames,
  onHideDirectory,
  onOpenSkill,
  onShowDirectory,
  searchActive,
}: ProviderSkillListProps) {
  const [expandedProviderIds, setExpandedProviderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(
    null,
  );

  function toggleProvider(providerKey: string) {
    setExpandedProviderIds((current) => {
      const next = new Set(current);
      if (next.has(providerKey)) {
        next.delete(providerKey);
      } else {
        next.add(providerKey);
      }
      return next;
    });
  }

  function toggleFolder(providerKey: string, folderKey: string) {
    const id = `${providerKey}:${folderKey}`;
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderSkillRows(skills: SystemSkill[], depth: number) {
    return (
      <div className="space-y-1">
        {skills.map((skill) => (
          <button
            key={skill.id}
            className={`flex w-full items-center gap-2 rounded-[11px] border border-transparent text-left text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
              compact ? "px-2 py-1.5 text-[12px]" : "px-2.5 py-1.5 text-[13px]"
            }`}
            onClick={() => onOpenSkill(skill)}
            style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
            title={skill.name}
            type="button"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--accent-strong)]">
              <SkillNodeIcon />
            </span>
            <span className="truncate">{skill.name}</span>
          </button>
        ))}
      </div>
    );
  }

  function buildFolderContextItems(path: string) {
    const directoryName = getPathLeafName(path);
    const isHidden = hiddenDirectoryNames.some((value) => value.toLowerCase() === directoryName.toLowerCase());

    return [
      {
        label: "Abrir en explorador",
        icon: <FolderOpenIcon />,
        onClick: () => {
          void invoke("reveal_in_file_explorer", { path });
        },
      },
      {
        label: `${isHidden ? "Mostrar" : "Ocultar"} carpeta \"${directoryName}\"`,
        onClick: () => {
          void (isHidden ? onShowDirectory(directoryName) : onHideDirectory(directoryName));
        },
      },
    ];
  }

  function renderFolderNode({
    groupKey,
    nodeKey,
    label,
    path,
    depth,
    skills = [],
    children,
    contextPath = path,
  }: {
    groupKey: string;
    nodeKey: string;
    label: string;
    path: string;
    depth: number;
    skills?: SystemSkill[];
    children?: ReactNode;
    contextPath?: string | null;
  }) {
    const folderId = `${groupKey}:${nodeKey}`;
    const folderExpanded = searchActive || expandedFolderIds.has(folderId);
    const content = children ?? (skills.length > 0 ? renderSkillRows(skills, depth + 1) : null);

    if (!content) {
      return null;
    }

    return (
      <div key={folderId} className="space-y-1">
        <button
          className={`flex w-full items-center gap-2 rounded-[11px] border border-transparent text-left text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
            compact ? "px-2 py-1.5 text-[12px]" : "px-2.5 py-1.5 text-[13px]"
          }`}
          onClick={() => toggleFolder(groupKey, nodeKey)}
          onContextMenu={contextPath ? (e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, path: contextPath });
          } : undefined}
          style={{ paddingLeft: (compact ? 8 : 12) + depth * (compact ? 12 : 16) }}
          title={path || label}
          type="button"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-[6px] bg-white/[0.02] text-[var(--violet-strong)]">
            <ExpandIcon expanded={folderExpanded} />
          </span>
          <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--violet)]">
            <FolderNodeIcon expanded={folderExpanded} name={label} path={path || label} />
          </span>
          <span className="truncate">{label}</span>
        </button>

        {folderExpanded ? content : null}
      </div>
    );
  }

  function renderFolder(group: ProviderSkillGroup, folder: ProviderSkillFolderGroup) {
    return renderFolderNode({
      groupKey: group.key,
      nodeKey: folder.key,
      label: folder.label,
      path: folder.path,
      depth: 1,
      skills: folder.skills,
    });
  }

  function renderGlobalFolders(group: ProviderSkillGroup) {
    const globalFolders = group.folders.filter((folder) => folder.section === "global");
    if (globalFolders.length === 0) {
      return null;
    }

    const globalRoots = new Map<string, {
      key: string;
      label: string;
      path: string;
      folders: ProviderSkillFolderGroup[];
    }>();

    for (const folder of globalFolders) {
      const rootKey = (folder.globalRootLabel ?? folder.label).toLowerCase();
      const existing = globalRoots.get(rootKey) ?? {
        key: rootKey,
        label: folder.globalRootLabel ?? folder.label,
        path: folder.globalRootLabel ?? folder.label,
        folders: [],
      };

      existing.folders.push(folder);
      globalRoots.set(rootKey, existing);
    }

    const rootChildren = [...globalRoots.values()]
      .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }))
      .map((root) => {
        const directSkills = root.folders
          .filter((folder) => !folder.globalRelativePath)
          .flatMap((folder) => folder.skills)
          .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
        const nestedFolders = root.folders
          .filter((folder) => folder.globalRelativePath)
          .sort((left, right) =>
            (left.globalRelativePath ?? "").localeCompare(right.globalRelativePath ?? "", undefined, {
              sensitivity: "base",
            }),
          );

        return renderFolderNode({
          groupKey: group.key,
          nodeKey: `global-root:${root.key}`,
          label: root.label,
          path: root.path,
          depth: 2,
          children: (
            <div className="space-y-1">
              {directSkills.length > 0 ? renderSkillRows(directSkills, 3) : null}
              {nestedFolders.map((folder) =>
                renderFolderNode({
                  groupKey: group.key,
                  nodeKey: `global-path:${folder.key}`,
                  label: folder.globalRelativePath ?? folder.label,
                  path: folder.path,
                  depth: 3,
                  skills: folder.skills,
                }),
              )}
            </div>
          ),
        });
      });

    return renderFolderNode({
      groupKey: group.key,
      nodeKey: "global",
      label: "Global",
      path: "",
      depth: 1,
      contextPath: null,
      children: <div className="space-y-1.5">{rootChildren}</div>,
    });
  }

  return (
    <>
      <div className="space-y-1.5">
        {groups.map((group) => (
          <div key={group.key} className="space-y-1">
            <button
              className={`flex w-full items-center gap-2 rounded-[12px] border border-transparent text-left text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
                compact ? "px-2 py-1.5 text-[13px]" : "px-2.5 py-2 text-sm"
              }`}
              onClick={() => toggleProvider(group.key)}
              title={group.label}
              type="button"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[6px] bg-white/[0.02] text-[var(--violet-strong)]">
                <ExpandIcon expanded={searchActive || expandedProviderIds.has(group.key)} />
              </span>
              <span className="inline-flex h-[18px] w-[18px] items-center justify-center text-[var(--accent-strong)]">
                {group.assetPath ? (
                  <img
                    alt={`${group.label} provider`}
                    className="h-[18px] w-[18px] object-contain"
                    src={group.assetPath}
                  />
                ) : (
                  <FolderNodeIcon expanded={searchActive || expandedProviderIds.has(group.key)} name={group.label} root />
                )}
              </span>
              <span className="truncate">{group.label}</span>
              <span className="ml-auto shrink-0 rounded-full border border-[var(--border)] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--text)]">
                {group.folders.reduce((total, folder) => total + folder.skills.length, 0)}
              </span>
            </button>

            {(searchActive || expandedProviderIds.has(group.key)) ? (
              <div className="space-y-1.5">
                {group.folders.filter((folder) => folder.section === "project").map((folder) => renderFolder(group, folder))}
                {renderGlobalFolders(group)}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildFolderContextItems(contextMenu.path)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
