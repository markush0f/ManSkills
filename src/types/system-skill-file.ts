import type { Language } from "./language";

export type SystemSkillFile = {
  id: string;
  relativePath: string;
  language: Language;
  content: string;
};
