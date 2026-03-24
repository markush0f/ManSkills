import { useState } from "react";
import type { MarketplaceSkill } from "../../ide/types";
import { useIde } from "../../contexts/IdeContext";
import { shellPanelClass } from "../shared/ui";

function SkillRow({
  installed,
  onInstallSkill,
  skill,
}: {
  installed: boolean;
  onInstallSkill: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
}) {
  return (
    <article className="grid gap-3 border-b border-[var(--border)] px-6 py-4 transition hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1.9fr)_130px_90px_110px] lg:items-center lg:gap-4">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-[var(--text)]">{skill.name}</h2>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">{skill.summary}</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-[var(--muted)]">{skill.author}</div>
      <div className="text-xs text-[var(--muted)]">{skill.downloads}</div>

      <div className="flex items-center justify-start lg:justify-end">
        <button
          className={`rounded-[8px] px-2.5 py-1.5 text-xs font-medium transition ${installed
              ? "text-[var(--text)] hover:bg-white/6"
              : "text-[var(--muted)] hover:bg-white/6 hover:text-[var(--text)]"
            }`}
          onClick={() => onInstallSkill(skill)}
        >
          {installed ? "Abrir" : "Instalar"}
        </button>
      </div>
    </article>
  );
}

export function MarketplaceWorkspace() {
  const { installMarketplaceSkill, installedSkillSlugs, marketplaceSkills } = useIde();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSkills = marketplaceSkills.filter((skill) => {
    return (
      normalizedQuery.length === 0 ||
      skill.name.toLowerCase().includes(normalizedQuery) ||
      skill.summary.toLowerCase().includes(normalizedQuery) ||
      skill.author.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <section
      className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[linear-gradient(180deg,rgba(10,16,22,0.94),rgba(12,20,27,0.88))]`}
    >
      <div className="border-b border-[var(--border)] px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Marketplace</p>
            <h1 className="mt-2 text-lg font-semibold text-[var(--text)]">AI Skills</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Lista simple de skills instalables para el workspace actual.
            </p>
          </div>

          <div className="flex gap-4 text-xs text-[var(--muted)]">
            <span>{filteredSkills.length} resultados</span>
            <span>{installedSkillSlugs.size} instaladas</span>
          </div>
        </div>

        <div className="mt-4">
          <input
            className="h-10 w-full border-b border-[var(--border)] bg-transparent px-0 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-strong)] lg:max-w-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar por nombre, autor o descripcion"
            value={query}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="hidden border-b border-[var(--border)] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)] lg:grid lg:grid-cols-[minmax(0,1.9fr)_130px_90px_110px] lg:gap-4">
          <span>Skill</span>
          <span>Autor</span>
          <span>Descargas</span>
          <span className="text-right">Accion</span>
        </div>

        {filteredSkills.length > 0 ? (
          <div>
            {filteredSkills.map((skill) => (
              <SkillRow
                key={skill.id}
                installed={installedSkillSlugs.has(skill.slug)}
                onInstallSkill={installMarketplaceSkill}
                skill={skill}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
            No hay skills que coincidan con el filtro actual.
          </div>
        )}
      </div>
    </section>
  );
}
