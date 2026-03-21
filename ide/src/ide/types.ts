export type Language = "tsx" | "ts" | "css" | "json";

export type IdeFile = {
  id: string;
  path: string;
  language: Language;
  content: string;
  savedContent: string;
};

export type DiagnosticLevel = "error" | "warning" | "info";

export type Diagnostic = {
  fileId: string;
  line: number;
  message: string;
  level: DiagnosticLevel;
};

export type TreeNode =
  | {
      kind: "folder";
      name: string;
      path: string;
      children: TreeNode[];
    }
  | {
      kind: "file";
      name: string;
      path: string;
      fileId: string;
    };

export type TreeBranch = {
  children: Map<string, TreeBranch>;
  fileId?: string;
};

export type SidebarView = "explorer" | "search" | "problems";

export type BottomPanelView = "terminal" | "problems";

export type CursorPosition = {
  line: number;
  column: number;
};
