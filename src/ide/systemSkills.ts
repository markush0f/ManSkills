import type {
  IdeFile,
  SystemSkill,
  SystemSkillContentResponse,
  SystemSkillFile,
  SystemSkillTreeFile,
  SystemSkillTreeNode,
} from "../types";

export function hashString(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
}

export function getSystemSkillWorkspaceRoot(skill: SystemSkill) {
  return `system-skills/${skill.slug}-${hashString(skill.id)}`;
}

export function getSystemSkillMainFileId(skill: SystemSkill) {
  return `system-skill:${skill.id}:SKILL.md`;
}

export function getSystemSkillFileId(skill: SystemSkill, relativePath: string) {
  return `system-skill:${skill.id}:${relativePath}`;
}

export function flattenSystemSkillTree(nodes: SystemSkillTreeNode[]): SystemSkill[] {
  return nodes.flatMap((node) => {
    const currentSkill = node.skill ? [node.skill] : [];
    return [...currentSkill, ...flattenSystemSkillTree(node.children)];
  });
}

export function collectSystemSkillIds(nodes: SystemSkillTreeNode[]): Set<string> {
  return new Set(flattenSystemSkillTree(nodes).map((skill) => skill.id));
}

export function toSystemSkillTreeFiles(files: SystemSkillFile[]): SystemSkillTreeFile[] {
  return files.map((file) => ({
    id: file.id,
    language: file.language,
    relativePath: file.relativePath,
  }));
}

export function buildSystemSkillFiles(
  skill: SystemSkill,
  response: SystemSkillContentResponse,
): IdeFile[] {
  const workspaceRoot = getSystemSkillWorkspaceRoot(skill);

  return response.files.map((file) => ({
    id: getSystemSkillFileId(skill, file.relativePath),
    path: `${workspaceRoot}/${file.relativePath}`,
    language: file.language,
    content: file.content,
    savedContent: file.content,
    rootPath: response.rootPath,
    relativePath: file.relativePath,
    isWritable: true,
  }));
}

export function mergeWorkspaceFiles(currentFiles: IdeFile[], incomingFiles: IdeFile[]): IdeFile[] {
  if (incomingFiles.length === 0) {
    return currentFiles;
  }

  const incomingFileMap = new Map(incomingFiles.map((file) => [file.id, file] as const));
  const mergedFiles = currentFiles.map((file) => {
    const incomingFile = incomingFileMap.get(file.id);

    if (!incomingFile) {
      return file;
    }

    incomingFileMap.delete(file.id);

    if (file.content !== file.savedContent) {
      return {
        ...file,
        isWritable: incomingFile.isWritable,
        language: incomingFile.language,
        path: incomingFile.path,
        relativePath: incomingFile.relativePath,
        rootPath: incomingFile.rootPath,
        savedContent: incomingFile.savedContent,
      };
    }

    return incomingFile;
  });

  return [...mergedFiles, ...incomingFileMap.values()];
}

export function attachSystemSkillFileTree(
  nodes: SystemSkillTreeNode[],
  skillFilesBySkillId: Record<string, SystemSkillTreeFile[]>,
): SystemSkillTreeNode[] {
  return nodes.map((node) => {
    const nextChildren = attachSystemSkillFileTree(node.children, skillFilesBySkillId);

    if (node.kind !== "skill" || !node.skill) {
      if (nextChildren === node.children) {
        return node;
      }

      return {
        ...node,
        children: nextChildren,
      };
    }

    const listedFiles = skillFilesBySkillId[node.skill.id];
    if (!listedFiles) {
      return {
        ...node,
        children: nextChildren,
      };
    }

    return {
      ...node,
      children: buildSystemSkillFileTree(node.skill, listedFiles),
    };
  });
}

type FileTreeBranch = {
  children: Map<string, FileTreeBranch>;
  file?: SystemSkillTreeFile;
};

export function buildSystemSkillFileTree(
  skill: SystemSkill,
  files: SystemSkillTreeFile[],
): SystemSkillTreeNode[] {
  const root = new Map<string, FileTreeBranch>();

  for (const file of files) {
    const parts = file.relativePath.split("/").filter(Boolean);
    let current = root;

    for (const [index, part] of parts.entries()) {
      const isFile = index === parts.length - 1;
      const next = current.get(part);

      if (isFile) {
        current.set(part, {
          children: new Map(),
          file,
        });
        continue;
      }

      if (!next) {
        current.set(part, { children: new Map() });
      }

      current = current.get(part)!.children;
    }
  }

  return mapFileBranchesToNodes(skill, root);
}

function mapFileBranchesToNodes(
  skill: SystemSkill,
  entries: Map<string, FileTreeBranch>,
  basePath = "",
): SystemSkillTreeNode[] {
  return [...entries.entries()]
    .map(([name, value]) => {
      const path = basePath ? `${basePath}/${name}` : name;

      if (value.file) {
        return {
          children: [],
          file: value.file,
          id: `skill-file:${value.file.id}`,
          kind: "file",
          name,
          path: `${skill.rootPath}/${path}`,
          skill: null,
        } satisfies SystemSkillTreeNode;
      }

      return {
        children: mapFileBranchesToNodes(skill, value.children, path),
        file: null,
        id: `skill-directory:${skill.id}:${path}`,
        kind: "directory",
        name,
        path: `${skill.rootPath}/${path}`,
        skill: null,
      } satisfies SystemSkillTreeNode;
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "directory" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
}
