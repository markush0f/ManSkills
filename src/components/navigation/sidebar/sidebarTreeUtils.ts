import type { IdeFile, SystemSkill, SystemSkillTreeNode, TreeNode } from "../../../types";
import { findProviderAsset, findSpecialFolderAsset } from "../../../constants/provider-assets";

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

    const { rootName, rootPath } = deriveCompactRootDisplayFromSkillsPath(node.path, node.name);

    return {
      ...node,
      name: rootName,
      path: rootPath,
      children: nextChildren,
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

export type SystemSkillSection = "project" | "global";

export type ProviderSkillFolderGroup = {
  key: string;
  label: string;
  path: string;
  section: SystemSkillSection;
  globalRootLabel: string | null;
  globalRootPath: string | null;
  globalRelativePath: string | null;
  skills: SystemSkill[];
};

export type SystemSkillLocation = Omit<ProviderSkillFolderGroup, "skills">;

const PROVIDER_ORDER = [
  "agents",
  "codex",
  "claude",
  "cursor",
  "windsurf",
  "gemini",
  "roo",
  "kiro",
  "goose",
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
      path: folder.path,
      section: folder.section,
      globalRootLabel: folder.globalRootLabel,
      globalRootPath: folder.globalRootPath,
      globalRelativePath: folder.globalRelativePath,
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
        .sort((left, right) => {
          if (left.section !== right.section) {
            return left.section === "project" ? -1 : 1;
          }

          return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
        });

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

export function classifySystemSkillSection(skill: SystemSkill): SystemSkillSection {
  return describeSystemSkillLocation(skill).section;
}

export function describeSystemSkillLocation(skill: SystemSkill): SystemSkillLocation {
  const containerPath = deriveSkillContainerPath(skill.rootPath);
  const section = detectFolderSection(containerPath);
  if (section === "global") {
    const globalLocation = buildSkillFolderGroup(containerPath, "global");
    if (
      skill.gitRepositoryRootPath
      && globalLocation.globalRootPath
      && isPathWithinRoot(globalLocation.globalRootPath, skill.gitRepositoryRootPath)
    ) {
      return buildSkillFolderGroup(skill.gitRepositoryRootPath, "project");
    }

    return globalLocation;
  }

  if (skill.gitRepositoryRootPath) {
    return buildSkillFolderGroup(skill.gitRepositoryRootPath, "project");
  }

  return buildSkillFolderGroup(containerPath, "project");
}

export function filterSystemSkillTreeBySection(
  nodes: SystemSkillTreeNode[],
  section: SystemSkillSection,
): SystemSkillTreeNode[] {
  return nodes
    .map((node) => {
      if (node.kind === "skill" && node.skill) {
        return classifySystemSkillSection(node.skill) === section ? cloneNode(node) : null;
      }

      const filteredChildren = filterSystemSkillTreeBySection(node.children, section);
      if (filteredChildren.length === 0) {
        return null;
      }

      return {
        ...node,
        children: filteredChildren,
      };
    })
    .filter((node): node is SystemSkillTreeNode => node !== null);
}

export function buildProjectSystemSkillTree(nodes: SystemSkillTreeNode[]): SystemSkillTreeNode[] {
  const projectRoots = new Map<string, SystemSkillTreeNode>();

  for (const skillNode of collectSkillNodes(nodes)) {
    const skill = skillNode.skill;
    if (!skill) {
      continue;
    }

    const location = describeSystemSkillLocation(skill);
    if (location.section !== "project") {
      continue;
    }

    const projectKey = normalizePathKey(location.path);
    const root = projectRoots.get(projectKey) ?? {
      id: `project-root:${projectKey}`,
      name: getProjectDisplayName(location.path),
      path: location.path,
      kind: "root",
      skill: null,
      file: null,
      children: [],
    } satisfies SystemSkillTreeNode;

    root.children.push(cloneNode(skillNode));
    projectRoots.set(projectKey, root);
  }

  return sortSystemTreeNodes([...projectRoots.values()]);
}

export function buildGlobalSystemSkillTree(nodes: SystemSkillTreeNode[]): SystemSkillTreeNode[] {
  const globalRoots = new Map<string, SystemSkillTreeNode>();

  for (const skillNode of collectSkillNodes(nodes)) {
    const skill = skillNode.skill;
    if (!skill) {
      continue;
    }

    const location = describeSystemSkillLocation(skill);
    if (location.section !== "global" || !location.globalRootLabel || !location.globalRootPath) {
      continue;
    }

    const rootKey = location.globalRootLabel.toLowerCase();
    const root = globalRoots.get(rootKey) ?? {
      id: `global-root:${rootKey}`,
      name: location.globalRootLabel,
      path: location.globalRootLabel,
      kind: "directory",
      skill: null,
      file: null,
      children: [],
    } satisfies SystemSkillTreeNode;

    let currentChildren = root.children;
    let currentPath = location.globalRootLabel;
    for (const segment of (location.globalRelativePath ?? "").split("/").filter(Boolean)) {
      currentPath = `${currentPath}/${segment}`;
      const segmentKey = normalizePathKey(currentPath);
      let directory = currentChildren.find(
        (child) => child.kind === "directory" && normalizePathKey(child.path) === segmentKey,
      );

      if (!directory) {
        directory = {
          id: `global-directory:${segmentKey}`,
          name: segment,
          path: currentPath,
          kind: "directory",
          skill: null,
          file: null,
          children: [],
        } satisfies SystemSkillTreeNode;
        currentChildren.push(directory);
      }

      currentChildren = directory.children;
    }

    currentChildren.push(cloneNode(skillNode));
    globalRoots.set(rootKey, root);
  }

  return sortSystemTreeNodes([...globalRoots.values()]);
}

function detectSkillProvider(skill: SystemSkill): { key: string; label: string; assetPath: string | null } {
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

  if (skill.source === "workspace") {
    return { key: "workspace", label: "Workspace", assetPath: null };
  }

  return { key: "other", label: "Other", assetPath: null };
}

function detectSkillFolder(skill: SystemSkill): {
  key: string;
  label: string;
  path: string;
  section: SystemSkillSection;
  globalRootLabel: string | null;
  globalRootPath: string | null;
  globalRelativePath: string | null;
} {
  return describeSystemSkillLocation(skill);
}

function buildSkillFolderGroup(path: string, section: SystemSkillSection): SystemSkillLocation {
  const normalizedPath = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalizedPath.split("/").filter(Boolean);
  const globalInfo = section === "global" ? describeGlobalPath(normalizedPath) : null;
  const label = section === "global"
    ? globalInfo?.displayLabel || compactDisplayPath(parts) || parts[parts.length - 1] || path
    : compactDisplayPath(parts) || parts[parts.length - 1] || path;

  return {
    key: normalizedPath.toLowerCase(),
    label,
    path: normalizedPath || path,
    section,
    globalRootLabel: globalInfo?.rootLabel ?? null,
    globalRootPath: globalInfo?.rootPath ?? null,
    globalRelativePath: globalInfo?.relativePath ?? null,
  };
}

function detectFolderSection(path: string): SystemSkillSection {
  const normalizedPath = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalizeDisplayParts(normalizedPath.split("/").filter(Boolean));
  const relevantParts = stripHomePrefix(parts);

  return relevantParts.some((part) => part.startsWith(".")) ? "global" : "project";
}

function deriveSkillContainerPath(path: string) {
  const normalizedPath = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalizedPath.split("/").filter(Boolean);
  const skillsIndex = parts.findIndex((part) => part.toLowerCase() === "skills");

  if (skillsIndex > 0) {
    return buildPathFromParts(parts.slice(0, skillsIndex), path);
  }

  const separatorIndex = normalizedPath.lastIndexOf("/");
  if (separatorIndex < 0) {
    return path;
  }

  return normalizedPath.slice(0, separatorIndex) || path;
}

function deriveCompactRootDisplayFromSkillsPath(path: string, fallbackName: string) {
  const parts = path.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) {
    return {
      rootName: fallbackName,
      rootPath: path,
    };
  }

  const parentParts = parts.slice(0, -1);
  if (parentParts.length === 0) {
    return {
      rootName: fallbackName,
      rootPath: path,
    };
  }

  const rootPath = path.replace(/[\\/]skills[\\/]*$/i, "") || path;
  const rootName = compactDisplayPath(parentParts) || parentParts[parentParts.length - 1] || fallbackName;

  return {
    rootName,
    rootPath,
  };
}

function compactDisplayPath(parts: string[]) {
  const normalizedParts = normalizeDisplayParts(parts);
  let startIndex = 0;

  if (normalizedParts[0] && /^[a-z]:$/i.test(normalizedParts[0])) {
    startIndex = 1;
  }

  const homeContainer = normalizedParts[startIndex]?.toLowerCase();
  if ((homeContainer === "users" || homeContainer === "home") && normalizedParts.length > startIndex + 1) {
    startIndex += 1;
  }

  return normalizedParts.slice(startIndex).join("/");
}

function getProjectDisplayName(path: string) {
  const normalizedPath = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalizeDisplayParts(normalizedPath.split("/").filter(Boolean));
  const lastPart = parts[parts.length - 1];

  if (lastPart) {
    return lastPart;
  }

  return compactDisplayPath(parts) || path;
}

function describeGlobalPath(path: string) {
  const normalizedPath = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalizeDisplayParts(normalizedPath.split("/").filter(Boolean));
  const homeRelativeParts = stripHomePrefix(parts);
  const hiddenRootIndex = homeRelativeParts.findIndex((part) => part.startsWith("."));

  if (hiddenRootIndex < 0) {
    return null;
  }

  const rootLabel = homeRelativeParts[hiddenRootIndex] ?? null;
  if (!rootLabel) {
    return null;
  }

  const relativeParts = [
    ...homeRelativeParts.slice(0, hiddenRootIndex),
    ...homeRelativeParts.slice(hiddenRootIndex + 1),
  ];
  const relativePath = relativeParts.length > 0 ? relativeParts.join("/") : null;
  const rootPathParts = parts.slice(0, parts.length - homeRelativeParts.length + hiddenRootIndex + 1);

  return {
    displayLabel: [rootLabel, relativePath].filter(Boolean).join("/"),
    rootLabel,
    rootPath: buildPathFromParts(rootPathParts, path).replace(/\\/g, "/"),
    relativePath,
  };
}

function stripHomePrefix(parts: string[]) {
  let startIndex = 0;

  if (parts[0] && /^[a-z]:$/i.test(parts[0])) {
    startIndex = 1;
  }

  const homeContainer = parts[startIndex]?.toLowerCase();
  if ((homeContainer === "users" || homeContainer === "home") && parts.length > startIndex + 1) {
    startIndex += 2;
  }

  return parts.slice(startIndex);
}

function normalizeDisplayParts(parts: string[]) {
  if (parts[0] === "?") {
    return parts.slice(1);
  }

  return parts;
}

function buildPathFromParts(parts: string[], originalPath: string) {
  if (parts.length === 0) {
    return originalPath;
  }

  if (/^[a-z]:$/i.test(parts[0] ?? "")) {
    return parts.join("/");
  }

  if (originalPath.includes("\\")) {
    return parts.join("\\");
  }

  return originalPath.startsWith("/") ? `/${parts.join("/")}` : parts.join("/");
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

    existing.children = mergeNodeChildren(existing.children, node.children);
  }

  const mergedRoots = [...mergedProjectRoots.values()].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );

  return [...mergedRoots, ...passthroughNodes];
}

function collectSkillNodes(nodes: SystemSkillTreeNode[]): SystemSkillTreeNode[] {
  return nodes.flatMap((node) => {
    if (node.kind === "skill") {
      return [node];
    }

    return collectSkillNodes(node.children);
  });
}

function sortSystemTreeNodes(nodes: SystemSkillTreeNode[]): SystemSkillTreeNode[] {
  return [...nodes]
    .map((node) => ({
      ...node,
      children: sortSystemTreeNodes(node.children),
    }))
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "directory" ? -1 : 1;
      }

      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
    });
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

  if (normalized.startsWith("//?/")) {
    normalized = normalized.slice(4);
  } else if (normalized.startsWith("/?/")) {
    normalized = normalized.slice(3);
  }

  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function isPathWithinRoot(path: string, root: string) {
  const normalizedPath = normalizePathKey(path);
  const normalizedRoot = normalizePathKey(root);

  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}
