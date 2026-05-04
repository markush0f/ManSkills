import { createContext, useContext, type ReactNode } from "react";
import { useSkillMarketplace } from "../hooks/useSkillMarketplace";

type MarketplaceStateContextValue = ReturnType<typeof useSkillMarketplace>;

const MarketplaceStateContext = createContext<MarketplaceStateContextValue | null>(null);

export function MarketplaceStateProvider({ children }: { children: ReactNode }) {
  const value = useSkillMarketplace();

  return <MarketplaceStateContext.Provider value={value}>{children}</MarketplaceStateContext.Provider>;
}

export function useMarketplaceState() {
  const context = useContext(MarketplaceStateContext);

  if (!context) {
    throw new Error("useMarketplaceState must be used within a MarketplaceStateProvider");
  }

  return context;
}
