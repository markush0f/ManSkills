import type { SystemSkillFile } from "./system-skill-file";

export type SystemSkillContentResponse = {
  rootPath: string;
  files: SystemSkillFile[];
};
