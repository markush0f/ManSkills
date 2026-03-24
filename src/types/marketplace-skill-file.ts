import type { Language } from "./language";

export type MarketplaceSkillFile = {
  idSuffix: string;
  path: string;
  language: Language;
  content: string;
};
