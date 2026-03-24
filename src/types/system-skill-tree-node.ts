import type { SystemSkill } from "./system-skill";
import type { SystemSkillTreeFile } from "./system-skill-tree-file";
import type { SystemSkillTreeNodeKind } from "./system-skill-tree-node-kind";

export type SystemSkillTreeNode = {
  id: string;
  name: string;
  path: string;
  kind: SystemSkillTreeNodeKind;
  skill: SystemSkill | null;
  file: SystemSkillTreeFile | null;
  children: SystemSkillTreeNode[];
};
