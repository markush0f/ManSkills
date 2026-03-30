import { invoke } from "@tauri-apps/api/core";
import { startTransition, useEffect, useState } from "react";
import type { SkillScanResponse, SystemSkill } from "../types";

function applyMarketplaceResponse(
  response: SkillScanResponse,
  setSkills: (value: SystemSkill[]) => void,
  setScannedRoots: (value: string[]) => void,
  setScanMs: (value: number | null) => void,
  setError: (value: string | null) => void,
  setLoading: (value: boolean) => void,
) {
  startTransition(() => {
    setSkills(response.skills);
    setScannedRoots(response.scannedRoots);
    setScanMs(response.durationMs);
    setError(null);
    setLoading(false);
  });
}

export function useSkillMarketplace() {
  const [marketplaceSkills, setMarketplaceSkills] = useState<SystemSkill[]>([]);
  const [marketplaceScannedRoots, setMarketplaceScannedRoots] = useState<string[]>([]);
  const [marketplaceScanMs, setMarketplaceScanMs] = useState<number | null>(null);
  const [marketplaceLoading, setMarketplaceLoading] = useState(true);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);

  function refreshMarketplace() {
    setMarketplaceLoading(true);
    setMarketplaceError(null);

    return invoke<SkillScanResponse>("scan_system_skills")
      .then((response) => {
        applyMarketplaceResponse(
          response,
          setMarketplaceSkills,
          setMarketplaceScannedRoots,
          setMarketplaceScanMs,
          setMarketplaceError,
          setMarketplaceLoading,
        );
        return response;
      })
      .catch((error) => {
        setMarketplaceSkills([]);
        setMarketplaceScannedRoots([]);
        setMarketplaceScanMs(null);
        setMarketplaceError("No se pudo cargar el catalogo del marketplace.");
        setMarketplaceLoading(false);
        throw error;
      });
  }

  useEffect(() => {
    let cancelled = false;

    invoke<SkillScanResponse>("scan_system_skills")
      .then((response) => {
        if (cancelled) {
          return;
        }

        applyMarketplaceResponse(
          response,
          setMarketplaceSkills,
          setMarketplaceScannedRoots,
          setMarketplaceScanMs,
          setMarketplaceError,
          setMarketplaceLoading,
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setMarketplaceSkills([]);
        setMarketplaceScannedRoots([]);
        setMarketplaceScanMs(null);
        setMarketplaceError("No se pudo cargar el catalogo del marketplace.");
        setMarketplaceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    marketplaceError,
    marketplaceLoading,
    marketplaceScanMs,
    marketplaceScannedRoots,
    marketplaceSkills,
    refreshMarketplace,
  };
}
