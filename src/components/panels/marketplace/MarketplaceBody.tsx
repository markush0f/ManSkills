import { MarketplaceCatalog } from "./MarketplaceCatalog";
import { MarketplaceSkillDetail } from "./MarketplaceSkillDetail";
import { useMarketplace } from "./MarketplaceContext";

export function MarketplaceBody() {
  const {
    marketplaceError,
    marketplaceLoading,
    selectedMarketplaceSkill,
  } = useMarketplace();

  if (marketplaceError) {
    return <div className="px-4 py-4 text-[13px] text-[#ffb3a7]">{marketplaceError}</div>;
  }

  if (marketplaceLoading) {
    return (
      <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
        Cargando catalogo...
      </div>
    );
  }

  if (selectedMarketplaceSkill) {
    return <MarketplaceSkillDetail />;
  }

  return <MarketplaceCatalog />;
}
