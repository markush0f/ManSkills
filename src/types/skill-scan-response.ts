import type { SystemSkill } from "./system-skill";

export type SkillScanResponse = {
  skills: SystemSkill[];
  scannedRoots: string[];
  durationMs: number;
};
