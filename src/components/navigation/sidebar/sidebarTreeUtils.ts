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
  const transformedNodes = nodes.map((node) => {
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

    const { projectName, projectPath, providerDirectoryName, providerDirectoryPath } =
      deriveProjectDisplayFromSkillsPath(node.path, node.name);
    const providerDirectoryNode: SystemSkillTreeNode = {
      id: `${node.id}:provider:${providerDirectoryName.toLowerCase()}`,
      name: providerDirectoryName,
      path: providerDirectoryPath,
      kind: "directory",
      skill: null,
      file: null,
      children: nextChildren,
    };

    return {
      ...node,
      name: projectName,
      path: projectPath,
      children: [providerDirectoryNode],
    };
  });

  return mergeProjectRoots(transformedNodes);
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

  const parentSegments = parentNormalizedPath.split("/").filter(Boolean);
  const parentDirectoryName = parentSegments[parentSegments.length - 1] ?? parentNormalizedPath;

  return {
    key: parentNormalizedPath.toLowerCase(),
    label: parentDirectoryName,
  };
}

function deriveProjectDisplayFromSkillsPath(path: string, fallbackName: string) {
  const parts = path.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) {
    return {
      projectName: fallbackName,
      projectPath: path,
      providerDirectoryName: "skills",
      providerDirectoryPath: path,
    };
  }

  const skillsIndex = parts.length - 1;
  let projectIndex = skillsIndex - 1;
  if (projectIndex >= 0 && PROVIDER_CONTAINER_NAMES.has(parts[projectIndex].toLowerCase())) {
    projectIndex -= 1;
  }

  if (projectIndex < 0) {
    return {
      projectName: fallbackName,
      projectPath: path,
      providerDirectoryName: "skills",
      providerDirectoryPath: path,
    };
  }

  const projectName = parts[projectIndex];
  const projectPathParts = parts.slice(0, projectIndex + 1);
  const projectPath = path.includes("\\")
    ? projectPathParts.join("\\")
    : `/${projectPathParts.join("/")}`;
  const providerIndex = projectIndex + 1;
  const providerDirectoryName = (parts[providerIndex] ?? "skills").replace(/^\./, "");
  const providerPathParts = parts.slice(0, providerIndex + 1);
  const providerDirectoryPath = path.includes("\\")
    ? providerPathParts.join("\\")
    : `/${providerPathParts.join("/")}`;

  return {
    projectName,
    projectPath,
    providerDirectoryName,
    providerDirectoryPath,
  };
}

function mergeProjectRoots(nodes: SystemSkillTreeNode[]) {
  const mergedProjectRoots = new Map<string, SystemSkillTreeNode>();
  const passthroughNodes: SystemSkillTreeNode[] = [];

  for (const node of nodes) {
    if (node.kind !== "root") {
      passthroughNodes.push(node);
      continue;
    }

    const projectKey = normalizePathKey(node.path);
    const existing = mergedProjectRoots.get(projectKey);

    if (!existing) {
      mergedProjectRoots.set(projectKey, {
        ...node,
        children: node.children.map((child) => cloneNode(child)),
      });
      continue;
    }

    existing.children = mergeProviderDirectories(existing.children, node.children);
  }

  const mergedRoots = [...mergedProjectRoots.values()].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );

  return [...mergedRoots, ...passthroughNodes];
}

function mergeProviderDirectories(
  currentDirectories: SystemSkillTreeNode[],
  incomingDirectories: SystemSkillTreeNode[],
) {
  const mergedByProvider = new Map<string, SystemSkillTreeNode>();

  for (const directory of currentDirectories) {
    const providerKey = directory.name.toLowerCase();
    mergedByProvider.set(providerKey, cloneNode(directory));
  }

  for (const directory of incomingDirectories) {
    const providerKey = directory.name.toLowerCase();
    const existing = mergedByProvider.get(providerKey);

    if (!existing) {
      mergedByProvider.set(providerKey, cloneNode(directory));
      continue;
    }

    existing.children = mergeNodeChildren(existing.children, directory.children);
  }

  return [...mergedByProvider.values()].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}

function mergeNodeChildren(currentChildren: SystemSkillTreeNode[], incomingChildren: SystemSkillTreeNode[]) {
  const merged = new Map<string, SystemSkillTreeNode>();

  const registerNode = (node: SystemSkillTreeNode) => {
    const nodeKey = nodeIdentity(node);
    const existing = merged.get(nodeKey);

    if (!existing) {
      merged.set(nodeKey, cloneNode(node));
      return;
    }

    if (existing.kind === "directory" && node.kind === "directory") {
      existing.children = mergeNodeChildren(existing.children, node.children);
    }
  };

  for (const child of currentChildren) {
    registerNode(child);
  }

  for (const child of incomingChildren) {
    registerNode(child);
  }

  return [...merged.values()].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
}

function cloneNode(node: SystemSkillTreeNode): SystemSkillTreeNode {
  return {
    ...node,
    children: node.children.map((child) => cloneNode(child)),
  };
}

function nodeIdentity(node: SystemSkillTreeNode) {
  if (node.kind === "skill" && node.skill) {
    return `skill:${normalizePathKey(node.skill.rootPath)}`;
  }

  if (node.kind === "file" && node.file) {
    return `file:${node.file.id}`;
  }

  return `${node.kind}:${normalizePathKey(node.path)}`;
}

function normalizePathKey(path: string) {
  let normalized = path.replace(/\\/g, "/").toLowerCase();

  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}
