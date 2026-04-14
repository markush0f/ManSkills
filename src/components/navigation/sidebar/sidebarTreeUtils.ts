import type { IdeFile, SystemSkill, SystemSkillTreeNode, TreeNode } from "../../../types";
import { findProviderAsset, findSpecialFolderAsset } from "../../../constants/provider-assets";

const PROVIDER_CONTAINER_NAMES = new Set([
  ".agents",
  "agents",
  ".codex",
  "codex",
  ".claude",
  "claude",
  ".cursor",
  "cursor",
  ".windsurf",
  "windsurf",
  ".roo",
  "roo",
  ".gemini",
  "gemini",
  ".kiro",
  "kiro",
  ".goose",
  "goose",
]);

export function getFileTone(language?: IdeFile["language"]) {
  if (language === "md") {
    return "border-[#d79432]/25 bg-[#d79432]/10 text-[#ffd08b]";
  }

  if (language === "json") {
    return "border-[#4f8f89]/25 bg-[#4f8f89]/10 text-[#9dd8d1]";
  }

  return "border-[var(--border)] bg-white/5 text-[var(--muted)]";
}

export function getFileBadgeLabel(language?: IdeFile["language"]) {
  if (language === "json") {
    return "{}";
  }

  if (language === "md") {
    return "MD";
  }

  return language?.toUpperCase().slice(0, 2) ?? "--";
}

export function getSystemSkillSourceLabel(source: SystemSkill["source"]) {
  if (source === "managed") {
    return "Managed";
  }

  if (source === "workspace") {
    return "Workspace";
  }

  return "System";
}

export function matchesSidebarQuery(query: string, ...values: Array<string | undefined>) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function filterTreeNodes(
  nodes: TreeNode[],
  fileById: ReadonlyMap<string, IdeFile>,
  query: string,
): TreeNode[] {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length === 0) {
    return nodes;
  }

  return nodes.reduce<TreeNode[]>((filteredNodes, node) => {
    if (node.kind === "file") {
      const file = fileById.get(node.fileId);

      if (matchesSidebarQuery(normalizedQuery, node.name, node.path, file?.path)) {
        filteredNodes.push(node);
      }

      return filteredNodes;
    }

    const filteredChildren = filterTreeNodes(node.children, fileById, normalizedQuery);

    if (matchesSidebarQuery(normalizedQuery, node.name, node.path) || filteredChildren.length > 0) {
      filteredNodes.push({ ...node, children: filteredChildren });
    }

    return filteredNodes;
  }, []);
}

export function filterSystemSkillTreeNodes(nodes: SystemSkillTreeNode[], query: string): SystemSkillTreeNode[] {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length === 0) {
    return nodes;
  }

  return nodes.reduce<SystemSkillTreeNode[]>((filteredNodes, node) => {
    const filteredChildren = filterSystemSkillTreeNodes(node.children, normalizedQuery);

    const nodeMatches = matchesSidebarQuery(
      normalizedQuery,
      node.name,
      node.path,
      node.skill?.name,
      node.skill?.summary,
      node.skill?.rootPath,
      node.skill?.manifestPath,
      node.file?.relativePath,
    );

    if (nodeMatches || filteredChildren.length > 0) {
      filteredNodes.push({ ...node, children: filteredChildren });
    }

    return filteredNodes;
  }, []);
}

export function reshapeSystemSkillRootsForDisplay(nodes: SystemSkillTreeNode[]): SystemSkillTreeNode[] {
  return nodes.map((node) => {
    const nextChildren = reshapeSystemSkillRootsForDisplay(node.children);

    if (node.kind !== "root" || node.name.toLowerCase() !== "skills") {
      if (nextChildren === node.children) {
        return node;
      }

      return {
        ...node,
        children: nextChildren,
      };
    }

    const { projectName, projectPath } = deriveProjectDisplayFromSkillsPath(node.path, node.name);
    const skillsDirectoryNode: SystemSkillTreeNode = {
      id: `${node.id}:display-skills`,
      name: "skills",
      path: node.path,
      kind: "directory",
      skill: null,
      file: null,
      children: nextChildren,
    };

    return {
      ...node,
      name: projectName,
      path: projectPath,
      children: [skillsDirectoryNode],
    };
  });
}

export type ProviderSkillGroup = {
  key: string;
  label: string;
  assetPath: string | null;
  folders: ProviderSkillFolderGroup[];
};

export type ProviderSkillFolderGroup = {
  key: string;
  label: string;
  skills: SystemSkill[];
};

const PROVIDER_ORDER = [
  "codex",
  "claude",
  "cursor",
  "windsurf",
  "gemini",
  "roo",
  "kiro",
  "goose",
  "agents",
  "workspace",
  "other",
] as const;

const PROVIDER_ORDER_INDEX = new Map<string, number>(
  PROVIDER_ORDER.map((key, index) => [key, index] as const),
);

export function buildProviderSkillGroups(skills: SystemSkill[], query: string): ProviderSkillGroup[] {
  const grouped = new Map<
    string,
    {
      key: string;
      label: string;
      assetPath: string | null;
      folders: Map<string, ProviderSkillFolderGroup>;
    }
  >();

  for (const skill of skills) {
    const provider = detectSkillProvider(skill);
    const folder = detectSkillFolder(skill);
    const existing = grouped.get(provider.key) ?? {
      key: provider.key,
      label: provider.label,
      assetPath: provider.assetPath,
      folders: new Map<string, ProviderSkillFolderGroup>(),
    };
    const existingFolder = existing.folders.get(folder.key) ?? {
      key: folder.key,
      label: folder.label,
      skills: [],
    };

    existingFolder.skills.push(skill);
    existing.folders.set(folder.key, existingFolder);
    grouped.set(provider.key, existing);
  }

  const normalizedQuery = query.trim();
  const queryEnabled = normalizedQuery.length > 0;

  const groups = [...grouped.values()]
    .map((group) => {
      const providerMatches = queryEnabled && matchesSidebarQuery(normalizedQuery, group.label);
      const folders = [...group.folders.values()]
        .map((folder) => {
          const folderMatches = queryEnabled && matchesSidebarQuery(normalizedQuery, folder.label);
          const visibleSkills = providerMatches || folderMatches
            ? folder.skills
            : folder.skills.filter((skill) =>
                matchesSidebarQuery(
                  normalizedQuery,
                  skill.name,
                  skill.summary,
                  skill.rootPath,
                  skill.manifestPath,
                ),
              );

          return {
            ...folder,
            skills: [...visibleSkills].sort((left, right) =>
              left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
            ),
          };
        })
        .filter((folder) => folder.skills.length > 0)
        .sort((left, right) =>
          left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
        );

      return {
        key: group.key,
        label: group.label,
        assetPath: group.assetPath,
        folders,
      } satisfies ProviderSkillGroup;
    })
    .filter((group) => {
      if (!queryEnabled) {
        return group.folders.length > 0;
      }

      return group.folders.length > 0;
    })
    .sort((left, right) => {
      const leftOrder = PROVIDER_ORDER_INDEX.get(left.key) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = PROVIDER_ORDER_INDEX.get(right.key) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
    });

  return groups;
}

function detectSkillProvider(skill: SystemSkill): { key: string; label: string; assetPath: string | null } {
  if (skill.source === "workspace") {
    return { key: "workspace", label: "Workspace", assetPath: null };
  }

  const normalizedPath = skill.rootPath.replace(/\\/g, "/");
  const pathSegments = normalizedPath.split("/").filter(Boolean);

  for (let index = pathSegments.length - 1; index >= 0; index -= 1) {
    const segment = pathSegments[index];
    const providerAsset = findProviderAsset(segment, segment);
    if (providerAsset) {
      return {
        key: providerAsset.slug,
        label: providerAsset.label,
        assetPath: providerAsset.assetPath,
      };
    }
  }

  for (let index = pathSegments.length - 1; index >= 0; index -= 1) {
    const segment = pathSegments[index];
    const specialFolderAsset = findSpecialFolderAsset(segment, segment);
    if (specialFolderAsset) {
      return {
        key: specialFolderAsset.slug,
        label: specialFolderAsset.label,
        assetPath: specialFolderAsset.assetPath,
      };
    }
  }

  return { key: "other", label: "Other", assetPath: null };
}

function detectSkillFolder(skill: SystemSkill): { key: string; label: string } {
  const normalizedPath = skill.rootPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const separatorIndex = normalizedPath.lastIndexOf("/");
  if (separatorIndex < 0) {
    return { key: "root", label: skill.rootPath };
  }

  const parentNormalizedPath = normalizedPath.slice(0, separatorIndex);
  if (!parentNormalizedPath) {
    return { key: "root", label: skill.rootPath };
  }

  const parentDisplayPath = skill.rootPath.includes("\\")
    ? parentNormalizedPath.replace(/\//g, "\\")
    : parentNormalizedPath;

  return {
    key: parentNormalizedPath.toLowerCase(),
    label: parentDisplayPath,
  };
}

function deriveProjectDisplayFromSkillsPath(path: string, fallbackName: string) {
  const parts = path.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) {
    return {
      projectName: fallbackName,
      projectPath: path,
    };
  }

  let projectIndex = parts.length - 2;
  if (projectIndex >= 0 && PROVIDER_CONTAINER_NAMES.has(parts[projectIndex].toLowerCase())) {
    projectIndex -= 1;
  }

  if (projectIndex < 0) {
    return {
      projectName: fallbackName,
      projectPath: path,
    };
  }

  const projectName = parts[projectIndex];
  const projectPathParts = parts.slice(0, projectIndex + 1);
  const projectPath = path.includes("\\")
    ? projectPathParts.join("\\")
    : `/${projectPathParts.join("/")}`;

  return {
    projectName,
    projectPath,
  };
}
