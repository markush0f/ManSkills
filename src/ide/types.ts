export type Language = "ts" | "json" | "md" | "txt";

export type IdeFile = {
  id: string;
  path: string;
  language: Language;
  content: string;
  savedContent: string;
};

export type MarketplaceSkillFile = {
  idSuffix: string;
  path: string;
  language: Language;
  content: string;
};

export type MarketplaceSkill = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  author: string;
  downloads: string;
  rating: string;
  files: MarketplaceSkillFile[];
};

export type SystemSkillSource = "managed" | "workspace" | "system";

export type SystemSkill = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  manifestPath: string;
  rootPath: string;
  source: SystemSkillSource | string;
};

export type SkillScanResponse = {
  skills: SystemSkill[];
  scannedRoots: string[];
  durationMs: number;
};

export type SystemSkillFile = {
  id: string;
  relativePath: string;
  language: Language;
  content: string;
};

export type SystemSkillContentResponse = {
  rootPath: string;
  files: SystemSkillFile[];
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
