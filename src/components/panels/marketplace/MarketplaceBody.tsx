import type { MarketplaceSkill, SystemSkill } from "../../../types";
import { MarketplaceCatalog } from "./MarketplaceCatalog";
import { MarketplaceSkillDetail } from "./MarketplaceSkillDetail";
import type { MarketplaceSkillState } from "./types";

type MarketplaceBodyProps = {
  closeMarketplaceSkillDetail: () => void;
  findInstalledMarketplaceSkill: (skill: MarketplaceSkill) => SystemSkill | null;
  getSkillState: (skill: MarketplaceSkill) => MarketplaceSkillState;
  marketplaceError: string | null;
  marketplaceHasSearched: boolean;
  marketplaceLoading: boolean;
  marketplaceSkills: MarketplaceSkill[];
  onDelete: (skill: MarketplaceSkill) => void;
  onOpenDetail: (skill: MarketplaceSkill) => void;
  onOpenInstalled: (skill: MarketplaceSkill) => void;
  onReinstall: (skill: MarketplaceSkill) => void;
  onUpdate: (skill: MarketplaceSkill) => void;
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
  submitInstall: (skill: MarketplaceSkill) => void;
  submitOpenInstalled: (skill: MarketplaceSkill) => void;
  submitUninstall: (skill: MarketplaceSkill) => void;
  submitUpdate: (skill: MarketplaceSkill) => void;
};

export function MarketplaceBody({
  closeMarketplaceSkillDetail,
  findInstalledMarketplaceSkill,
  getSkillState,
  marketplaceError,
  marketplaceHasSearched,
  marketplaceLoading,
  marketplaceSkills,
  onDelete,
  onOpenDetail,
  onOpenInstalled,
  onReinstall,
  onUpdate,
  selectedCollectionLabel,
  selectedInstalledCollectionLabel,
  selectedInstalledPath,
  selectedInstalledTargetLabel,
  selectedMarketplaceSkill,
  selectedSkillManifest,
  selectedSkillManifestError,
  selectedSkillManifestLoading,
  selectedSkillState,
  selectedTargetLabel,
  submitInstall,
  submitOpenInstalled,
  submitUninstall,
  submitUpdate,
}: MarketplaceBodyProps) {
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
    return (
      <MarketplaceSkillDetail
        manifest={selectedSkillManifest}
        manifestError={selectedSkillManifestError}
        manifestLoading={selectedSkillManifestLoading}
        onBack={closeMarketplaceSkillDetail}
        onInstall={submitInstall}
        onOpenInstalled={submitOpenInstalled}
        onUninstall={submitUninstall}
        onUpdate={submitUpdate}
        selectedCollectionLabel={selectedCollectionLabel}
        selectedInstalledCollectionLabel={selectedInstalledCollectionLabel}
        selectedInstalledPath={selectedInstalledPath}
        selectedInstalledTargetLabel={selectedInstalledTargetLabel}
        selectedSkillState={selectedSkillState}
        selectedTargetLabel={selectedTargetLabel}
        skill={selectedMarketplaceSkill}
      />
    );
  }

  return (
    <MarketplaceCatalog
      findInstalledMarketplaceSkill={findInstalledMarketplaceSkill}
      getSkillState={getSkillState}
      marketplaceHasSearched={marketplaceHasSearched}
      marketplaceSkills={marketplaceSkills}
      onDelete={onDelete}
      onOpenDetail={onOpenDetail}
      onOpenInstalled={onOpenInstalled}
      onReinstall={onReinstall}
      onUpdate={onUpdate}
    />
  );
}
