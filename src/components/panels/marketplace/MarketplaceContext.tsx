import { createContext, useContext, type ReactNode } from "react";
import type { MarketplaceInstallTarget, MarketplaceSkill, SystemSkill } from "../../../types";
import type { MarketplaceSkillState } from "./types";

export type MarketplaceContextValue = {
  closeMarketplaceSkillDetail: () => void;
  findInstalledMarketplaceSkill: (skill: MarketplaceSkill) => SystemSkill | null;
  getSkillState: (skill: MarketplaceSkill) => MarketplaceSkillState;
  installMarketplaceSkill: (skill: MarketplaceSkill) => void;
  marketplaceError: string | null;
  marketplaceHasSearched: boolean;
  marketplaceLoading: boolean;
  marketplaceSearchMs: number | null;
  marketplaceSkills: MarketplaceSkill[];
  marketplaceTotal: number | null;
  onSearch: () => void;
  onUninstall: (skill: MarketplaceSkill) => void;
  onUpdate: (skill: MarketplaceSkill) => void;
  openInstalledMarketplaceSkill: (skill: MarketplaceSkill) => void;
  openMarketplaceSkillDetail: (skill: MarketplaceSkill) => void;
  query: string;
  refreshMarketplace: () => void;
  selectedCollectionLabel: string;
  selectedInstalledCollectionLabel: string;
  selectedInstalledPath: string | null;
  selectedInstalledTargetLabel: string;
  selectedMarketplaceSkill: MarketplaceSkill | null;
  selectedSkillManifest: string;
  selectedSkillManifestError: string | null;
  selectedSkillManifestLoading: boolean;
  selectedSkillState: MarketplaceSkillState;
  selectedTargetLabel: string;
  setQuery: (value: string) => void;
  updatePreferences: (updates: {
    marketplaceInstallCollection?: string;
    marketplaceInstallTarget?: MarketplaceInstallTarget;
  }) => void;
  preferences: {
    marketplaceInstallCollection: string;
    marketplaceInstallTarget: MarketplaceInstallTarget;
  };
};

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function MarketplaceProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MarketplaceContextValue;
}) {
  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);

  if (!context) {
    throw new Error("useMarketplace must be used within a MarketplaceProvider");
  }

  return context;
}
