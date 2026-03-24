import type {
  Diagnostic,
  DiagnosticLevel,
  IdeFile,
  Language,
  TreeBranch,
  TreeNode,
} from "./types";

export function getFileName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

export function getLanguageLabel(language: Language) {
  if (language === "ts") return "TypeScript";
  if (language === "md") return "Markdown";
  if (language === "txt") return "Texto";
  return "JSON";
}

export function getDiagnosticLevelLabel(level: DiagnosticLevel) {
  if (level === "error") return "Error";
  if (level === "warning") return "Warning";
  return "Info";
}

export function buildTree(files: IdeFile[]): TreeNode[] {
  const root = new Map<string, TreeBranch>();

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (const [index, part] of parts.entries()) {
      const isFile = index === parts.length - 1;
      const next = current.get(part);

      if (isFile) {
        current.set(part, { children: new Map(), fileId: file.id });
        continue;
      }

      if (!next) {
        current.set(part, { children: new Map() });
      }

      current = current.get(part)!.children;
    }
  }

  const mapToNodes = (entries: Map<string, TreeBranch>, base = ""): TreeNode[] =>
    [...entries.entries()]
      .map(([name, value]) => {
        const path = base ? `${base}/${name}` : name;

        if (value.fileId) {
          return {
            kind: "file",
            name,
            path,
            fileId: value.fileId,
          } satisfies TreeNode;
        }

        return {
          kind: "folder",
          name,
          path,
          children: mapToNodes(value.children, path),
        } satisfies TreeNode;
      })
      .sort((left, right) => {
        if (left.kind !== right.kind) {
          return left.kind === "folder" ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      });

  return mapToNodes(root);
}

export function deriveDiagnostics(files: IdeFile[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const file of files) {
    const lines = file.content.split("\n");

    lines.forEach((line, index) => {
      if (line.includes("TODO")) {
        diagnostics.push({
          fileId: file.id,
          line: index + 1,
          level: "warning",
          message: "Pending task left in source.",
        });
      }

      if (line.includes("any")) {
        diagnostics.push({
          fileId: file.id,
          line: index + 1,
          level: "warning",
          message: "Replace 'any' with a narrower type.",
        });
      }

      if (line.includes("console.log")) {
        diagnostics.push({
          fileId: file.id,
          line: index + 1,
          level: "info",
          message: "Debug statement will stay in output.",
        });
      }

      if (line.includes("FIXME")) {
        diagnostics.push({
          fileId: file.id,
          line: index + 1,
          level: "error",
          message: "Critical marker found in file.",
        });
      }
    });
  }

  return diagnostics;
}

export function getCursorPosition(text: string, offset: number) {
  const beforeCursor = text.slice(0, offset);
  const lines = beforeCursor.split("\n");
  const currentLine = lines[lines.length - 1] ?? "";

  return {
    line: lines.length,
    column: currentLine.length + 1,
  };
}
