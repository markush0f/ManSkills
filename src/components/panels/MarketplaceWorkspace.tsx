import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import type { MarketplaceSkill } from "../../types";
import { shellPanelClass } from "../shared/ui";
import { MarketplaceBody } from "./marketplace/MarketplaceBody";
import { MarketplaceProvider } from "./marketplace/MarketplaceContext";
import { MarketplaceToolbar } from "./marketplace/MarketplaceToolbar";
import {
  INSTALL_TARGET_OPTIONS,
  type MarketplaceSkillState,
} from "./marketplace/types";
import { MarketplaceTabsHeader } from "./MarketplaceTabsHeader";

export function MarketplaceWorkspace() {
  const {
    closeMarketplaceSkillDetail,
    findInstalledMarketplaceSkill,
    installingMarketplaceSkillIds,
    installMarketplaceSkill,
    isMarketplaceSkillUpdateAvailable,
    marketplaceError,
    marketplaceHasSearched,
    marketplaceInstallError,
    marketplaceInstallMessage,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    openInstalledMarketplaceSkill,
    openMarketplaceSkillDetail,
    preferences,
    refreshMarketplace,
    searchMarketplace,
    selectedMarketplaceSkill,
    uninstallMarketplaceSkill,
    uninstallingMarketplaceSkillIds,
    updateMarketplaceSkill,
    updatingMarketplaceSkillIds,
    updatePreferences,
  } = useIde();
  const [query, setQuery] = useState(marketplaceQuery);
  const [selectedSkillManifest, setSelectedSkillManifest] = useState("");
  const [selectedSkillManifestError, setSelectedSkillManifestError] = useState<string | null>(null);
  const [selectedSkillManifestLoading, setSelectedSkillManifestLoading] = useState(false);
  const selectedInstalledSkill = selectedMarketplaceSkill ? findInstalledMarketplaceSkill(selectedMarketplaceSkill) : null;
  const selectedTargetLabel =
    INSTALL_TARGET_OPTIONS.find((option) => option.value === preferences.marketplaceInstallTarget)?.label ??
    preferences.marketplaceInstallTarget;
  const selectedCollectionLabel = preferences.marketplaceInstallCollection.trim() || "raiz";

  useEffect(() => {
    setQuery(marketplaceQuery);
  }, [marketplaceQuery]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedMarketplaceSkill) {
      setSelectedSkillManifest("");
      setSelectedSkillManifestError(null);
      setSelectedSkillManifestLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setSelectedSkillManifest("");
    setSelectedSkillManifestError(null);
    setSelectedSkillManifestLoading(true);

    invoke<string>("load_marketplace_skill_manifest", {
      skill: selectedMarketplaceSkill,
    })
      .then((manifest) => {
        if (cancelled) {
          return;
        }

        setSelectedSkillManifest(manifest);
        setSelectedSkillManifestLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setSelectedSkillManifestError(
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "No se pudo cargar SKILL.md.",
        );
        setSelectedSkillManifestLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMarketplaceSkill]);

  function submitSearch() {
    void searchMarketplace(query.trim(), 1, 20);
  }

  function getSkillState(skill: MarketplaceSkill): MarketplaceSkillState {
    if (uninstallingMarketplaceSkillIds.has(skill.id)) {
      return "uninstalling";
    }

    if (updatingMarketplaceSkillIds.has(skill.id)) {
      return "updating";
    }

    if (installingMarketplaceSkillIds.has(skill.id)) {
      return "installing";
    }

    const installedSkill = findInstalledMarketplaceSkill(skill);
    if (!installedSkill) {
      return "not_installed";
    }

    if (isMarketplaceSkillUpdateAvailable(skill)) {
      return "update_available";
    }

    return "installed";
  }

  function confirmAndUninstall(skill: MarketplaceSkill) {
    const installedSkill = findInstalledMarketplaceSkill(skill);
    if (!installedSkill) {
      return;
    }

    const confirmed = window.confirm(`Se eliminara la skill instalada "${skill.name}" de ${installedSkill.rootPath}.`);
    if (!confirmed) {
      return;
    }

    void uninstallMarketplaceSkill(skill);
  }

  const selectedSkillState = selectedMarketplaceSkill ? getSkillState(selectedMarketplaceSkill) : "not_installed";
  const selectedInstalledTargetLabel = selectedInstalledSkill?.marketplaceInstall?.installTarget ?? selectedTargetLabel;
  const selectedInstalledCollectionLabel =
    selectedInstalledSkill?.marketplaceInstall?.installCollection?.trim() || selectedCollectionLabel;
  const selectedInstalledPath =
    selectedInstalledSkill?.marketplaceInstall?.installedPath ?? selectedInstalledSkill?.rootPath ?? null;

  const marketplaceContextValue = {
    closeMarketplaceSkillDetail,
    findInstalledMarketplaceSkill,
    getSkillState,
    installMarketplaceSkill: (skill: MarketplaceSkill) => {
      void installMarketplaceSkill(skill);
    },
    marketplaceError,
    marketplaceHasSearched,
    marketplaceInstallError,
    marketplaceInstallMessage,
    marketplaceLoading,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    onSearch: () => {
      if (query.trim().length > 0) {
        submitSearch();
        return;
      }

      void refreshMarketplace();
    },
    onUninstall: confirmAndUninstall,
    onUpdate: (skill: MarketplaceSkill) => {
      void updateMarketplaceSkill(skill);
    },
    openInstalledMarketplaceSkill,
    openMarketplaceSkillDetail,
    preferences,
    query,
    refreshMarketplace,
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
    setQuery,
    updatePreferences,
  };

  return (
    <MarketplaceProvider value={marketplaceContextValue}>
      <section
        className={`${shellPanelClass} h-full min-h-0 min-w-0 overflow-hidden bg-[image:var(--editor-bg)]`}
        style={{ fontFamily: "var(--font-soft)" }}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <MarketplaceTabsHeader />

          <div className="min-h-0 overflow-auto">
            <div className="flex w-full min-h-full flex-col">
              <section className="min-h-full border-y border-[var(--border)] bg-[rgba(10,16,21,0.9)]">
                <MarketplaceToolbar />

                {marketplaceInstallError ? (
                  <div className="border-b border-[#cf5e4f]/20 px-4 py-3 text-[12px] text-[#ffb3a7]">
                    {marketplaceInstallError}
                  </div>
                ) : null}

                {marketplaceInstallMessage ? (
                  <div className="border-b border-[rgba(79,168,199,0.18)] px-4 py-3 text-[12px] text-[#a7dfd9]">
                    {marketplaceInstallMessage}
                  </div>
                ) : null}

                <MarketplaceBody />
              </section>
            </div>
          </div>
        </div>
      </section>
    </MarketplaceProvider>
  );
}
