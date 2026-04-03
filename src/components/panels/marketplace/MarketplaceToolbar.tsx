import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/csr/FolderSimple";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import type { MarketplaceInstallTarget } from "../../../types";
import { SelectInput, TextInput } from "../../shared/formControls";
import { ghostButtonClass } from "../../shared/ui";
import { INSTALL_TARGET_OPTIONS } from "./types";

type MarketplaceToolbarProps = {
  installCollection: string;
  installTarget: MarketplaceInstallTarget;
  marketplaceLoading: boolean;
  marketplaceSearchMs: number | null;
  marketplaceSkillsCount: number;
  marketplaceTotal: number | null;
  onInstallCollectionChange: (value: string) => void;
  onInstallTargetChange: (target: MarketplaceInstallTarget) => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  query: string;
};

export function MarketplaceToolbar({
  installCollection,
  installTarget,
  marketplaceLoading,
  marketplaceSearchMs,
  marketplaceSkillsCount,
  marketplaceTotal,
  onInstallCollectionChange,
  onInstallTargetChange,
  onQueryChange,
  onSearch,
  query,
}: MarketplaceToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-[18px] font-medium text-[var(--text)]">
          <BagSimpleIcon className="h-5 w-5 text-[var(--accent-strong)]" weight="duotone" />
          <span>Marketplace</span>
          <a
            href="https://skillsmp.com/"
            className="text-[var(--accent)] hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            (SkillsMP)
          </a>
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-[12px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <BagSimpleIcon className="h-3.5 w-3.5" weight="bold" />
            {marketplaceSkillsCount} de {marketplaceTotal ?? marketplaceSkillsCount} skills
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ArrowClockwiseIcon className="h-3.5 w-3.5" weight="bold" />
            {marketplaceSearchMs ?? 0} ms
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          className="relative min-w-[280px]"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
        >
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <TextInput
            className="pl-9"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar en SkillsMP"
            value={query}
          />
        </div>

        <div className="relative min-w-[180px]">
          <FolderSimpleIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
            weight="bold"
          />
          <SelectInput
            className="min-w-[180px] pl-9"
            onChange={(event) => onInstallTargetChange(event.target.value as MarketplaceInstallTarget)}
            value={installTarget}
          >
            {INSTALL_TARGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="relative min-w-[220px]">
          <SealCheckIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
            weight="bold"
          />
          <TextInput
            className="pl-9"
            onChange={(event) => onInstallCollectionChange(event.target.value)}
            placeholder="Coleccion opcional"
            value={installCollection}
          />
        </div>

        <button className={ghostButtonClass} onClick={onSearch} type="button">
          <ArrowClockwiseIcon
            className={`mr-2 h-4 w-4 ${marketplaceLoading ? "animate-spin" : ""}`}
            weight="bold"
          />
          Buscar
        </button>
      </div>
    </div>
  );
}
