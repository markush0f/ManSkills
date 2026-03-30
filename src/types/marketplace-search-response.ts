import type { MarketplaceSkill } from "./marketplace-skill";

export type MarketplaceSearchResponse = {
  skills: MarketplaceSkill[];
  query: string;
  page: number;
  limit: number;
  total: number | null;
  durationMs: number;
};
