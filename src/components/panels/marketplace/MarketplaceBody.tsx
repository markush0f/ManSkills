import { MarketplaceCatalog } from "./MarketplaceCatalog";
import { MarketplaceSkillDetail } from "./MarketplaceSkillDetail";
import { useMarketplace } from "./MarketplaceContext";
import { SkeletonBlock } from "../../shared/SkeletonBlock";

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
      <div className="space-y-4 px-4 py-5">
        <div className="grid gap-3">
          {[0, 1, 2].map((index) => (
            <div className="rounded-[16px] border border-[var(--border)] px-4 py-4" key={index}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <SkeletonBlock className="h-4 w-40" />
                  <SkeletonBlock className="h-3 w-64 max-w-full" />
                  <SkeletonBlock className="h-3 w-full" />
                </div>
                <SkeletonBlock className="h-9 w-28 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedMarketplaceSkill) {
    return <MarketplaceSkillDetail />;
  }

  return <MarketplaceCatalog />;
}
