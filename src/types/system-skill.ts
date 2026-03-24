import type { SystemSkillSource } from "./system-skill-source";

export type SystemSkill = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  manifestPath: string;
  rootPath: string;
  source: SystemSkillSource | string;
};
