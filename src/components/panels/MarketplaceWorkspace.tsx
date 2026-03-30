import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { useDeferredValue, useMemo, useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { TextInput } from "../shared/formControls";
import { ghostButtonClass, shellPanelClass } from "../shared/ui";
import { MarketplaceTabsHeader } from "./MarketplaceTabsHeader";
import type { SystemSkill, SystemSkillSource } from "../../types";

type SourceFilter = "all" | SystemSkillSource;

const SOURCE_FILTERS: Array<{ label: string; value: SourceFilter }> = [
  { label: "Todo", value: "all" },
  { label: "Managed", value: "managed" },
  { label: "Workspace", value: "workspace" },
  { label: "System", value: "system" },
];

function getSourceLabel(source: string) {
  if (source === "managed") {
    return "Managed";
  }

  if (source === "workspace") {
    return "Workspace";
  }

  return "System";
}

function MarketplaceSkillRow({
  onOpenSkill,
  skill,
}: {
  onOpenSkill: (skill: SystemSkill) => void;
  skill: SystemSkill;
}) {
  return (
    <article className="grid gap-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.4fr)_140px_150px_auto] lg:items-center">
      <div className="min-w-0">
        <h2 className="truncate text-[14px] font-medium text-[var(--text)]">{skill.name}</h2>
        <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{skill.slug}</p>
      </div>

      <p className="line-clamp-2 text-[13px] leading-6 text-[#c2ccd5] lg:line-clamp-1">
        {skill.summary}
      </p>

      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        {getSourceLabel(skill.source)}
      </div>

      <div className="truncate text-[11px] text-[var(--muted)]">
        {skill.manifestPath.split(/[/\\]/).pop() ?? "SKILL.md"}
      </div>

      <div className="flex justify-start lg:justify-end">
        <button
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-transparent px-4 py-2.5 text-sm text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]"
          onClick={() => onOpenSkill(skill)}
          type="button"
        >
          <FolderOpenIcon className="mr-2 h-4 w-4" weight="bold" />
          Descargar
        </button>
      </div>
    </article>
  );
}

export function MarketplaceWorkspace() {
  const {
    closeFile,
    marketplaceError,
    marketplaceLoading,
    marketplaceScanMs,
    marketplaceSkills,
    openEditor,
    openFile,
    openFiles,
    openMarketplace,
    openSystemSkill,
    refreshMarketplace,
  } = useIde();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const deferredQuery = useDeferredValue(query);

  const filteredSkills = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return marketplaceSkills.filter((skill) => {
      if (sourceFilter !== "all" && skill.source !== sourceFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [skill.name, skill.slug, skill.summary, skill.rootPath].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [deferredQuery, marketplaceSkills, sourceFilter]);

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
                    {filteredSkills.length} de {marketplaceSkills.length} skills · {marketplaceScanMs ?? 0} ms
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative min-w-[280px]">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <TextInput
                      className="pl-9"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar"
                      value={query}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SOURCE_FILTERS.map((filter) => {
                      const active = sourceFilter === filter.value;

                      return (
                        <button
                          key={filter.value}
                          className={`rounded-[999px] border px-3 py-1.5 text-[11px] transition ${active
                            ? "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                            : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                            }`}
                          onClick={() => setSourceFilter(filter.value)}
                          type="button"
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className={ghostButtonClass}
                    onClick={() => void refreshMarketplace()}
                    type="button"
                  >
                    <ArrowClockwiseIcon className={`mr-2 h-4 w-4 ${marketplaceLoading ? "animate-spin" : ""}`} weight="bold" />
                    Refrescar
                  </button>
                </div>
              </div>

              <div className="hidden border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:grid lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.4fr)_140px_150px_auto] lg:gap-3">
                <span>Skill</span>
                <span>Resumen</span>
                <span>Origen</span>
                <span>Manifest</span>
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
              ) : filteredSkills.length > 0 ? (
                <div>
                  {filteredSkills.map((skill) => (
                    <MarketplaceSkillRow
                      key={skill.id}
                      onOpenSkill={openSystemSkill}
                      skill={skill}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
                  No hay skills que coincidan con el filtro actual.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
