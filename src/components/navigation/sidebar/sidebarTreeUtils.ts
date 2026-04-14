import type { IdeFile, SystemSkill, SystemSkillTreeNode, TreeNode } from "../../../types";

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
