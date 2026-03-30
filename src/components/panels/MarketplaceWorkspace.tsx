import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { useEffect, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { TextInput } from "../shared/formControls";
import { ghostButtonClass, shellPanelClass } from "../shared/ui";
import { MarketplaceTabsHeader } from "./MarketplaceTabsHeader";
import type { MarketplaceSkill } from "../../types";

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function MarketplaceSkillRow({ skill }: { skill: MarketplaceSkill }) {
  return (
    <article className="grid gap-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.4fr)_220px_120px_auto] lg:items-center">
      <div className="min-w-0">
        <h2 className="truncate text-[14px] font-medium text-[var(--text)]">{skill.name}</h2>
        <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
          {skill.author} · {skill.repository}
        </p>
      </div>

      <p className="line-clamp-2 text-[13px] leading-6 text-[#c2ccd5] lg:line-clamp-1">
        {skill.summary}
      </p>

      <div className="truncate text-[11px] text-[var(--muted)]">
        {formatUpdatedAt(skill.updatedAt)}
      </div>

      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        {skill.stars !== null ? `${skill.stars} stars` : "Sin stars"}
      </div>

      <div className="flex justify-start lg:justify-end">
        <button
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--muted)] opacity-60"
          disabled
          type="button"
        >
          Proximamente
        </button>
      </div>
    </article>
  );
}

export function MarketplaceWorkspace() {
  const {
    closeFile,
    marketplaceError,
    marketplaceHasSearched,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    openEditor,
    openFile,
    openFiles,
    openMarketplace,
    refreshMarketplace,
    searchMarketplace,
  } = useIde();
  const [query, setQuery] = useState(marketplaceQuery);

  useEffect(() => {
    setQuery(marketplaceQuery);
  }, [marketplaceQuery]);

  function submitSearch() {
    void searchMarketplace(query.trim(), 1, 20);
  }

  return (
    <section
      className={`${shellPanelClass} h-full min-h-0 min-w-0 overflow-hidden bg-[image:var(--editor-bg)]`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <MarketplaceTabsHeader
          closeFile={closeFile}
          openFile={openFile}
          openFiles={openFiles}
          openMarketplace={openMarketplace}
          returnToEditor={openEditor}
        />

        <div className="min-h-0 overflow-auto">
          <div className="flex w-full min-h-full flex-col">
            <section className="min-h-full border-y border-[var(--border)] bg-[rgba(10,16,21,0.9)]">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-[18px] font-medium text-[var(--text)]">Marketplace</h1>
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    {marketplaceSkills.length} de {marketplaceTotal ?? marketplaceSkills.length} skills · {marketplaceSearchMs ?? 0} ms
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div
                    className="relative min-w-[280px]"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitSearch();
                      }
                    }}
                  >
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <TextInput
                      className="pl-9"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar en SkillsMP"
                      value={query}
                    />
                  </div>

                  <button
                    className={ghostButtonClass}
                    onClick={() => {
                      if (query.trim().length > 0) {
                        submitSearch();
                        return;
                      }

                      void refreshMarketplace();
                    }}
                    type="button"
                  >
                    <ArrowClockwiseIcon className={`mr-2 h-4 w-4 ${marketplaceLoading ? "animate-spin" : ""}`} weight="bold" />
                    Buscar
                  </button>
                </div>
              </div>

              <div className="hidden border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:grid lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.4fr)_220px_120px_auto] lg:gap-3">
                <span>Skill</span>
                <span>Resumen</span>
                <span>Updated</span>
                <span>Stars</span>
                <span className="text-right">Accion</span>
              </div>

              {marketplaceError ? (
                <div className="px-4 py-4 text-[13px] text-[#ffb3a7]">
                  {marketplaceError}
                </div>
              ) : marketplaceLoading ? (
                <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
                  Cargando catalogo...
                </div>
              ) : marketplaceSkills.length > 0 ? (
                <div>
                  {marketplaceSkills.map((skill) => (
                    <MarketplaceSkillRow
                      key={skill.id}
                      skill={skill}
                    />
                  ))}
                </div>
              ) : !marketplaceHasSearched ? (
                <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
                  Escribe una busqueda para consultar SkillsMP.
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
                  No hay skills que coincidan con la busqueda actual.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
