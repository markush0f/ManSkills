import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { useDeferredValue, useMemo, useState } from "react";
import type { MarketplaceSkill } from "../../types";
import { useIde } from "../../contexts/IdeContext";
import { TextInput } from "../shared/formControls";
import { accentButtonClass, ghostButtonClass, shellPanelClass } from "../shared/ui";

function parseCompactNumber(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized.endsWith("k")) {
    return Number.parseFloat(normalized.slice(0, -1)) * 1000;
  }

  if (normalized.endsWith("m")) {
    return Number.parseFloat(normalized.slice(0, -1)) * 1_000_000;
  }

  return Number.parseFloat(normalized);
}

function toneFromCategory(category: string) {
  const tones = [
    {
      accent: "var(--accent)",
      badge: "border-[rgba(217,98,59,0.22)] bg-[rgba(217,98,59,0.1)] text-[var(--accent-strong)]",
      line: "bg-[linear-gradient(180deg,rgba(217,98,59,0.5),transparent)]",
    },
    {
      accent: "var(--cyan)",
      badge: "border-[rgba(79,168,199,0.22)] bg-[rgba(79,168,199,0.1)] text-[var(--cyan-strong)]",
      line: "bg-[linear-gradient(180deg,rgba(79,168,199,0.5),transparent)]",
    },
    {
      accent: "var(--violet)",
      badge: "border-[rgba(138,108,230,0.22)] bg-[rgba(138,108,230,0.1)] text-[var(--violet-strong)]",
      line: "bg-[linear-gradient(180deg,rgba(138,108,230,0.5),transparent)]",
    },
  ];

  const hash = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-[var(--text)]">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-[14px] border px-3 py-2.5 text-left text-[12px] transition ${
        active
          ? "border-[var(--border-strong)] bg-[linear-gradient(180deg,var(--accent-soft-strong),rgba(255,255,255,0.03))] text-[var(--text)]"
          : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/[0.025] hover:text-[var(--text)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
    </button>
  );
}

function SpotlightCard({
  installed,
  onInstallSkill,
  skill,
}: {
  installed: boolean;
  onInstallSkill: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
}) {
  const tone = toneFromCategory(skill.category);

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(16,24,33,0.96),rgba(10,16,22,0.98))] p-5">
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-[2px] ${tone.line}`} />
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${tone.badge}`}>
        spotlight
      </span>
      <h2 className="mt-4 text-[26px] font-semibold tracking-[-0.04em] text-[var(--text)]">{skill.name}</h2>
      <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]">{skill.category}</p>
      <p className="mt-4 text-[13px] leading-6 text-[#c3ced9]">{skill.summary}</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <InfoBlock label="rating" value={skill.rating} />
        <InfoBlock label="installs" value={skill.downloads} />
        <InfoBlock label="files" value={String(skill.files.length)} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-[12px] text-[var(--muted)]">{skill.author}</div>
        <button
          className={installed ? ghostButtonClass : accentButtonClass}
          onClick={() => onInstallSkill(skill)}
          type="button"
        >
          {installed ? "Abrir" : "Instalar"}
        </button>
      </div>
    </article>
  );
}

function SkillListRow({
  installed,
  onInstallSkill,
  skill,
}: {
  installed: boolean;
  onInstallSkill: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
}) {
  const tone = toneFromCategory(skill.category);

  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(13,20,28,0.94),rgba(9,14,19,0.98))] p-4 transition hover:border-[var(--border-strong)] hover:bg-[linear-gradient(180deg,rgba(16,24,33,0.98),rgba(10,15,22,0.98))]">
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-[2px] ${tone.line} opacity-60`} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_140px_90px_110px_120px] xl:items-center">
        <div className="min-w-0 pl-2">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border text-[12px] font-semibold uppercase ${tone.badge}`}
            >
              {skill.name.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-medium tracking-[-0.02em] text-[var(--text)]">
                  {skill.name}
                </h3>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${tone.badge}`}>
                  {skill.category}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-6 text-[#b9c5d1]">{skill.summary}</p>
            </div>
          </div>
        </div>

        <div className="text-[12px] text-[var(--muted)] xl:text-right">{skill.author}</div>
        <div className="text-[12px] text-[var(--muted)] xl:text-right">{skill.downloads}</div>
        <div className="flex items-center gap-1 text-[12px] text-[var(--muted)] xl:justify-end">
          <StarIcon className="h-4 w-4 text-[var(--accent-strong)]" weight="fill" />
          {skill.rating}
        </div>
        <div className="flex xl:justify-end">
          <button
            className={installed ? ghostButtonClass : accentButtonClass}
            onClick={() => onInstallSkill(skill)}
            type="button"
          >
            {installed ? "Abrir" : "Instalar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function MarketplaceWorkspace() {
  const { installMarketplaceSkill, installedSkillSlugs, marketplaceSkills } = useIde();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    marketplaceSkills.forEach((skill) => {
      counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
    });

    return counts;
  }, [marketplaceSkills]);

  const categories = useMemo(
    () => ["All", ...Array.from(categoryCounts.keys()).sort((left, right) => left.localeCompare(right))],
    [categoryCounts],
  );

  const filteredSkills = useMemo(() => {
    return marketplaceSkills.filter((skill) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.summary.toLowerCase().includes(normalizedQuery) ||
        skill.author.toLowerCase().includes(normalizedQuery) ||
        skill.category.toLowerCase().includes(normalizedQuery);

      const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [marketplaceSkills, normalizedQuery, selectedCategory]);

  const spotlightSkill = useMemo(() => {
    return [...marketplaceSkills].sort(
      (left, right) => parseCompactNumber(right.downloads) - parseCompactNumber(left.downloads),
    )[0];
  }, [marketplaceSkills]);

  return (
    <section
      className={`${shellPanelClass} h-full min-h-0 min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(217,98,59,0.09),transparent_24%),linear-gradient(180deg,rgba(8,13,18,0.99),rgba(5,9,13,1))]`}
    >
      <div className="h-full min-h-0 overflow-auto">
        <div className="grid min-h-full gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:p-5">
          <aside className="flex min-h-0 flex-col gap-4">
            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(16,24,33,0.96),rgba(10,16,22,0.98))] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.24)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Marketplace</p>
              <h1 className="mt-3 text-[34px] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--text)]">
                Skill deck
              </h1>
              <p className="mt-4 text-[13px] leading-6 text-[#c1ccd7]">
                Un panel compacto para revisar packages disponibles, separar categorias y abrir lo ya instalado.
              </p>

              <div className="mt-5 grid gap-3">
                <InfoBlock label="available" value={String(marketplaceSkills.length)} />
                <InfoBlock label="installed" value={String(installedSkillSlugs.size)} />
                <InfoBlock label="categories" value={String(categoryCounts.size)} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(14,21,29,0.96),rgba(8,13,18,0.98))] p-4">
              <TextInput
                className="h-11 rounded-[14px] bg-black/20 text-sm"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar skill, autor o categoria"
                value={query}
              />

              <div className="mt-4 space-y-1.5">
                {categories.map((category) => (
                  <FilterButton
                    key={category}
                    active={selectedCategory === category}
                    label={`${category} · ${category === "All" ? marketplaceSkills.length : (categoryCounts.get(category) ?? 0)}`}
                    onClick={() => setSelectedCategory(category)}
                  />
                ))}
              </div>
            </div>

            {spotlightSkill && (
              <SpotlightCard
                installed={installedSkillSlugs.has(spotlightSkill.slug)}
                onInstallSkill={installMarketplaceSkill}
                skill={spotlightSkill}
              />
            )}
          </aside>

          <div className="min-h-0 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(14,21,29,0.96),rgba(8,13,18,0.98))] shadow-[0_24px_48px_rgba(0,0,0,0.24)]">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(15,23,31,0.98),rgba(12,19,26,0.95))] px-4 py-4 backdrop-blur">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Filtered set</p>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-[var(--text)]">
                  {filteredSkills.length} matching skills
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>{selectedCategory}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                <span>{installedSkillSlugs.size} installed</span>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,1.7fr)_140px_90px_110px_120px] gap-4 border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] xl:grid">
              <span>Skill</span>
              <span className="text-right">Author</span>
              <span className="text-right">Installs</span>
              <span className="text-right">Rating</span>
              <span className="text-right">Action</span>
            </div>

            <div className="grid gap-3 p-4">
              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill) => (
                  <SkillListRow
                    key={skill.id}
                    installed={installedSkillSlugs.has(skill.slug)}
                    onInstallSkill={installMarketplaceSkill}
                    skill={skill}
                  />
                ))
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-[18px] border border-dashed border-[var(--border)] bg-black/10 px-6 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Empty result</p>
                    <p className="mt-3 text-[20px] font-medium tracking-[-0.03em] text-[var(--text)]">
                      No hay coincidencias para ese filtro.
                    </p>
                    <p className="mt-2 text-[13px] text-[var(--muted)]">
                      Prueba otra categoria o reduce la busqueda.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
