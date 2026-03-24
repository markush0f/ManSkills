import type { SystemSkillTreeNode } from "./system-skill-tree-node";

export type SkillTreeResponse = {
  roots: SystemSkillTreeNode[];
  scannedRoots: string[];
  durationMs: number;
};
