import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useIde } from "../contexts/IdeContext";
import { useUiShell } from "../contexts/UiShellContext";
import type { MarketplaceSkill } from "../types";
import {
  INSTALL_TARGET_OPTIONS,
  type MarketplaceSkillState,
} from "../components/panels/marketplace/types";

export function useMarketplaceDetail() {
  const { uiState, updateUiState } = useUiShell();
  const {
    closeMarketplaceSkillDetail,
    findInstalledMarketplaceSkill,
    installingMarketplaceSkillIds,
    installMarketplaceSkill,
    isMarketplaceSkillUpdateAvailable,
    marketplaceError,
    marketplaceHasSearched,
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
  const [query, setQueryState] = useState(uiState.marketplace.query || marketplaceQuery);
  const [selectedSkillManifest, setSelectedSkillManifest] = useState("");
  const [selectedSkillManifestError, setSelectedSkillManifestError] = useState<string | null>(null);
  const [selectedSkillManifestLoading, setSelectedSkillManifestLoading] = useState(false);
  const selectedInstalledSkill = selectedMarketplaceSkill ? findInstalledMarketplaceSkill(selectedMarketplaceSkill) : null;
  const selectedTargetLabel =
    INSTALL_TARGET_OPTIONS.find((option) => option.value === preferences.marketplaceInstallTarget)?.label ??
    preferences.marketplaceInstallTarget;
  const selectedCollectionLabel = preferences.marketplaceInstallCollection.trim() || "raiz";

  useEffect(() => {
    if (uiState.marketplace.query.length > 0) {
      return;
    }

    setQueryState(marketplaceQuery);
  }, [marketplaceQuery, uiState.marketplace.query]);

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

  function setQuery(value: string) {
    setQueryState(value);
    updateUiState((current) => ({
      ...current,
      marketplace: {
        ...current.marketplace,
        query: value,
      },
    }));
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

  return {
    marketplaceContextValue: {
      closeMarketplaceSkillDetail,
      findInstalledMarketplaceSkill,
      getSkillState,
      installMarketplaceSkill: (skill: MarketplaceSkill) => {
        void installMarketplaceSkill(skill);
      },
      marketplaceError,
      marketplaceHasSearched,
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
    },
  };
}
