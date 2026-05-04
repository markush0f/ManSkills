import { invoke } from "@tauri-apps/api/core";
import { startTransition, useEffect, useState } from "react";
import type { MarketplaceSearchResponse, MarketplaceSkill, MarketplaceSource } from "../types";

function requestMarketplaceSearch(query: string, page: number, limit: number) {
  return invoke<MarketplaceSearchResponse>("search_marketplace_skills", {
    query,
    page,
    limit,
  });
}

function requestMarketplaceTopSources(limit: number) {
  return invoke<MarketplaceSource[]>("load_marketplace_top_sources", {
    limit,
  });
}

function applyMarketplaceResponse(
  response: MarketplaceSearchResponse,
  setSkills: (value: MarketplaceSkill[]) => void,
  setHasSearched: (value: boolean) => void,
  setSearchMs: (value: number | null) => void,
  setTotal: (value: number | null) => void,
  setError: (value: string | null) => void,
  setLoading: (value: boolean) => void,
) {
  startTransition(() => {
    setSkills(response.skills);
    setHasSearched(true);
    setSearchMs(response.durationMs);
    setTotal(response.total);
    setError(null);
    setLoading(false);
  });
}

export function useSkillMarketplace() {
  const [marketplaceSkills, setMarketplaceSkills] = useState<MarketplaceSkill[]>([]);
  const [marketplaceTopSources, setMarketplaceTopSources] = useState<MarketplaceSource[]>([]);
  const [marketplaceHasSearched, setMarketplaceHasSearched] = useState(false);
  const [marketplaceSearchMs, setMarketplaceSearchMs] = useState<number | null>(null);
  const [marketplaceTotal, setMarketplaceTotal] = useState<number | null>(0);
  const [marketplaceQuery, setMarketplaceQuery] = useState("");
  const [marketplaceLoading, setMarketplaceLoading] = useState(true);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);

  function searchMarketplace(query = marketplaceQuery, page = 1, limit = 20) {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    setMarketplaceQuery(query);

    return requestMarketplaceSearch(query, page, limit)
      .then((response) => {
        applyMarketplaceResponse(
          response,
          setMarketplaceSkills,
          setMarketplaceHasSearched,
          setMarketplaceSearchMs,
          setMarketplaceTotal,
          setMarketplaceError,
          setMarketplaceLoading,
        );
        return response;
      })
      .catch((error: unknown) => {
        setMarketplaceSkills([]);
        setMarketplaceHasSearched(query.trim().length > 0);
        setMarketplaceSearchMs(null);
        setMarketplaceTotal(0);
        setMarketplaceError(
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "No se pudo cargar el marketplace desde la Skills API local.",
        );
        setMarketplaceLoading(false);
        throw error;
      });
  }

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      requestMarketplaceTopSources(12),
      requestMarketplaceSearch("", 1, 20),
    ]).then((results) => {
      if (cancelled) {
        return;
      }

      const [sourcesResult, skillsResult] = results;

      if (sourcesResult.status === "fulfilled") {
        setMarketplaceTopSources(sourcesResult.value);
      } else {
        setMarketplaceTopSources([]);
      }

      if (skillsResult.status === "fulfilled") {
        applyMarketplaceResponse(
          skillsResult.value,
          setMarketplaceSkills,
          setMarketplaceHasSearched,
          setMarketplaceSearchMs,
          setMarketplaceTotal,
          setMarketplaceError,
          setMarketplaceLoading,
        );
        return;
      }

      setMarketplaceSkills([]);
      setMarketplaceHasSearched(true);
      setMarketplaceSearchMs(null);
      setMarketplaceTotal(0);
      setMarketplaceLoading(false);
      setMarketplaceError(
        sourcesResult.status === "fulfilled"
          ? null
          : "No se pudo cargar el marketplace desde la Skills API local.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    marketplaceError,
    marketplaceHasSearched,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTopSources,
    marketplaceTotal,
    refreshMarketplace: () => searchMarketplace(),
    searchMarketplace,
  };
}
