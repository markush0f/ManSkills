import type { MarketplaceSkillFile } from "./marketplace-skill-file";

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
