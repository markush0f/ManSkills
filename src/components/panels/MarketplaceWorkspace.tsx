import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileTextIcon } from "@phosphor-icons/react/dist/csr/FileText";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/csr/FolderSimple";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/csr/LinkSimple";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, type ReactNode } from "react";
import { useIde } from "../../contexts/IdeContext";
import type { MarketplaceInstallTarget, MarketplaceSkill } from "../../types";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import { SelectInput, TextInput } from "../shared/formControls";
import { ghostButtonClass, shellPanelClass } from "../shared/ui";
import { MarketplaceTabsHeader } from "./MarketplaceTabsHeader";

const INSTALL_TARGET_OPTIONS: Array<{ label: string; value: MarketplaceInstallTarget }> = [
  { label: "Codex", value: "codex" },
  { label: "Claude", value: "claude" },
  { label: "Workspace", value: "workspace" },
];
const MARKETPLACE_TABLE_COLUMNS = "lg:grid-cols-[minmax(300px,0.95fr)_minmax(420px,1.5fr)_170px_140px_160px]";

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const seconds = Number(value);
  const normalizedDate = Number.isNaN(seconds) ? new Date(value) : new Date(seconds * 1000);

  if (Number.isNaN(normalizedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(normalizedDate);
}

function MarketplaceSkillRow({
  onOpenDetail,
  skill,
}: {
  onOpenDetail: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
}) {
  return (
    <article className={`grid gap-x-5 gap-y-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 ${MARKETPLACE_TABLE_COLUMNS} lg:items-center`}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 truncate text-[14px] font-medium text-[var(--text)]">
          <BagSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="duotone" />
          <span className="truncate">{skill.name}</span>
        </h2>
        <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[var(--muted)]">
          <UserIcon className="h-3.5 w-3.5 shrink-0" weight="bold" />
          <span className="truncate">{skill.author} - {skill.repository}</span>
        </p>
      </div>

      <div className="flex min-w-0 items-start gap-2 text-[#c2ccd5]">
        <FileTextIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)]" weight="duotone" />
        <p className="line-clamp-2 text-[13px] leading-6 lg:line-clamp-1">{skill.summary}</p>
      </div>

      <div className="flex items-center gap-1.5 truncate text-[11px] text-[var(--muted)]">
        <CalendarBlankIcon className="h-3.5 w-3.5 shrink-0" weight="bold" />
        <span className="truncate">{formatUpdatedAt(skill.updatedAt)}</span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)] lg:justify-self-end">
        <StarIcon className="h-3.5 w-3.5 shrink-0 text-[var(--warning-strong,#f5c451)]" weight="fill" />
        <span>{skill.stars !== null ? `${skill.stars}` : "Sin stars"}</span>
      </div>

      <div className="flex justify-start lg:justify-self-end">
        <button
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--border-strong)] px-4 py-2.5 text-sm text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]"
          onClick={() => onOpenDetail(skill)}
          type="button"
        >
          <DownloadSimpleIcon className="mr-2 h-4 w-4" weight="bold" />
          Descargar
        </button>
      </div>
    </article>
  );
}

function DetailMeta({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 break-words text-[13px] leading-6 text-[var(--text)]">{value}</p>
    </div>
  );
}

export function MarketplaceWorkspace() {
  const {
    closeFile,
    closeMarketplaceSkillDetail,
    installingMarketplaceSkillIds,
    installMarketplaceSkill,
    marketplaceError,
    marketplaceHasSearched,
    marketplaceInstallError,
    marketplaceInstallMessage,
    marketplaceLoading,
    marketplaceQuery,
    marketplaceSearchMs,
    marketplaceSkills,
    marketplaceTotal,
    openEditor,
    openFile,
    openFiles,
    openMarketplace,
    openMarketplaceSkillDetail,
    preferences,
    refreshMarketplace,
    searchMarketplace,
    selectedMarketplaceSkill,
    updatePreferences,
  } = useIde();
  const [query, setQuery] = useState(marketplaceQuery);
  const [selectedSkillManifest, setSelectedSkillManifest] = useState("");
  const [selectedSkillManifestError, setSelectedSkillManifestError] = useState<string | null>(null);
  const [selectedSkillManifestLoading, setSelectedSkillManifestLoading] = useState(false);
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
                      {marketplaceSkills.length} de {marketplaceTotal ?? marketplaceSkills.length} skills
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

                  <div className="relative min-w-[180px]">
                    <FolderSimpleIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" weight="bold" />
                    <SelectInput
                      className="min-w-[180px] pl-9"
                      onChange={(event) =>
                        updatePreferences({
                          marketplaceInstallTarget: event.target.value as MarketplaceInstallTarget,
                        })
                      }
                      value={preferences.marketplaceInstallTarget}
                    >
                      {INSTALL_TARGET_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </div>

                  <div className="relative min-w-[220px]">
                    <SealCheckIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" weight="bold" />
                    <TextInput
                      className="pl-9"
                      onChange={(event) =>
                        updatePreferences({
                          marketplaceInstallCollection: event.target.value,
                        })
                      }
                      placeholder="Coleccion opcional"
                      value={preferences.marketplaceInstallCollection}
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

              {marketplaceError ? (
                <div className="px-4 py-4 text-[13px] text-[#ffb3a7]">
                  {marketplaceError}
                </div>
              ) : marketplaceLoading ? (
                <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
                  Cargando catalogo...
                </div>
              ) : selectedMarketplaceSkill ? (
                <div className="px-4 py-5">
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                    <button
                      className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-[var(--text)]"
                      onClick={closeMarketplaceSkillDetail}
                      type="button"
                    >
                      <ArrowLeftIcon className="h-4 w-4" weight="bold" />
                      Volver al catalogo
                    </button>

                    <button
                      className={`inline-flex items-center justify-center rounded-[10px] border px-4 py-2.5 text-sm transition ${
                        installingMarketplaceSkillIds.has(selectedMarketplaceSkill.id)
                          ? "border-[var(--border)] bg-transparent text-[var(--muted)] opacity-60"
                          : "border-[var(--border-strong)] bg-transparent text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
                      }`}
                      disabled={installingMarketplaceSkillIds.has(selectedMarketplaceSkill.id)}
                      onClick={() => {
                        void installMarketplaceSkill(selectedMarketplaceSkill);
                      }}
                      type="button"
                    >
                      <DownloadSimpleIcon className="mr-2 h-4 w-4" weight="bold" />
                      {installingMarketplaceSkillIds.has(selectedMarketplaceSkill.id) ? "Descargando..." : "Descargar"}
                    </button>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3 border-b border-[var(--border)] pb-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] text-[var(--accent-strong)]">
                          <BagSimpleIcon className="h-5 w-5" weight="duotone" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-[28px] font-medium leading-tight text-[var(--text)]">
                            {selectedMarketplaceSkill.name}
                          </h2>
                          <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
                            <UserIcon className="h-4 w-4 shrink-0" weight="bold" />
                            <span>{selectedMarketplaceSkill.author}</span>
                            <span className="text-[var(--border-strong)]">/</span>
                            <span className="break-all">{selectedMarketplaceSkill.repository}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                        <DetailMeta
                          icon={<StarIcon className="h-3.5 w-3.5" weight="fill" />}
                          label="Stars"
                          value={selectedMarketplaceSkill.stars !== null ? String(selectedMarketplaceSkill.stars) : "Sin stars"}
                        />
                        <DetailMeta
                          icon={<CalendarBlankIcon className="h-3.5 w-3.5" weight="bold" />}
                          label="Updated"
                          value={formatUpdatedAt(selectedMarketplaceSkill.updatedAt)}
                        />
                        <DetailMeta
                          icon={<SealCheckIcon className="h-3.5 w-3.5" weight="duotone" />}
                          label="Slug"
                          value={selectedMarketplaceSkill.slug}
                        />
                        <DetailMeta
                          icon={<FolderSimpleIcon className="h-3.5 w-3.5" weight="bold" />}
                          label="Target"
                          value={selectedTargetLabel}
                        />
                      </div>

                      <div className="mt-5 rounded-[16px] border border-[var(--border)] p-5">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                          <FileTextIcon className="h-3.5 w-3.5" weight="bold" />
                          <span>Resumen completo</span>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-7 text-[var(--text)]">
                          {selectedMarketplaceSkill.summary}
                        </p>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[16px] border border-[var(--border)]">
                        <div className="border-b border-[var(--border)] px-5 py-4">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                            <FileTextIcon className="h-3.5 w-3.5" weight="bold" />
                            <span>SKILL.md</span>
                          </div>
                        </div>

                        {selectedSkillManifestError ? (
                          <div className="px-5 py-5 text-[13px] text-[#ffb3a7]">
                            {selectedSkillManifestError}
                          </div>
                        ) : selectedSkillManifestLoading ? (
                          <div className="px-5 py-8 text-[13px] text-[var(--muted)]">
                            Cargando SKILL.md...
                          </div>
                        ) : selectedSkillManifest ? (
                          <div className="min-h-[420px]">
                            <MarkdownPreview compact content={selectedSkillManifest} />
                          </div>
                        ) : (
                          <div className="px-5 py-8 text-[13px] text-[var(--muted)]">
                            No hay contenido disponible para SKILL.md.
                          </div>
                        )}
                      </div>
                    </div>

                    <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                      <div className="rounded-[16px] border border-[var(--border)] p-5">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                          <DownloadSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                          <span>Instalacion</span>
                        </div>
                        <p className="mt-3 text-[13px] leading-6 text-[var(--muted)]">
                          Esta skill se instalara en <span className="text-[var(--text)]">{selectedTargetLabel}</span>
                          {" / "}
                          <span className="text-[var(--text)]">{selectedCollectionLabel}</span>.
                        </p>
                        <button
                          className={`mt-4 inline-flex w-full items-center justify-center rounded-[10px] border px-4 py-3 text-sm transition ${
                            installingMarketplaceSkillIds.has(selectedMarketplaceSkill.id)
                              ? "border-[var(--border)] bg-transparent text-[var(--muted)] opacity-60"
                              : "border-[var(--border-strong)] bg-transparent text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
                          }`}
                          disabled={installingMarketplaceSkillIds.has(selectedMarketplaceSkill.id)}
                          onClick={() => {
                            void installMarketplaceSkill(selectedMarketplaceSkill);
                          }}
                          type="button"
                        >
                          <DownloadSimpleIcon className="mr-2 h-4 w-4" weight="bold" />
                          {installingMarketplaceSkillIds.has(selectedMarketplaceSkill.id) ? "Descargando..." : "Descargar skill"}
                        </button>
                      </div>

                      <div className="mt-4 rounded-[16px] border border-[var(--border)] p-5">
                        <div className="mb-4 rounded-[14px] border border-[var(--border)] px-4 py-3">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                            <FolderSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                            <span>Destino relativo</span>
                          </div>
                          <p className="mt-2 break-all text-[13px] leading-6 text-[var(--text)]">
                            {selectedTargetLabel} / {selectedCollectionLabel} / {selectedMarketplaceSkill.slug}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                          <LinkSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                          <span>Enlaces</span>
                        </div>
                        <div className="mt-4 grid gap-3">
                          {selectedMarketplaceSkill.githubUrl ? (
                            <a
                              className="rounded-[14px] border border-[var(--border)] px-4 py-3 text-[13px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.02]"
                              href={selectedMarketplaceSkill.githubUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <div className="flex items-center gap-2">
                                <LinkSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="bold" />
                                <span>Ver fuente en GitHub</span>
                              </div>
                              <p className="mt-2 break-all text-[12px] leading-5 text-[var(--muted)]">
                                {selectedMarketplaceSkill.githubUrl}
                              </p>
                            </a>
                          ) : null}

                          {selectedMarketplaceSkill.skillUrl ? (
                            <a
                              className="rounded-[14px] border border-[var(--border)] px-4 py-3 text-[13px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.02]"
                              href={selectedMarketplaceSkill.skillUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <div className="flex items-center gap-2">
                                <LinkSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="bold" />
                                <span>Abrir pagina en SkillsMP</span>
                              </div>
                              <p className="mt-2 break-all text-[12px] leading-5 text-[var(--muted)]">
                                {selectedMarketplaceSkill.skillUrl}
                              </p>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              ) : marketplaceSkills.length > 0 ? (
                <>
                  <div className={`hidden border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:grid ${MARKETPLACE_TABLE_COLUMNS} lg:gap-x-5`}>
                    <span className="inline-flex items-center gap-1.5">
                      <BagSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                      Skill
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileTextIcon className="h-3.5 w-3.5" weight="bold" />
                      Resumen
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarBlankIcon className="h-3.5 w-3.5" weight="bold" />
                      Updated
                    </span>
                    <span className="inline-flex items-center gap-1.5 lg:justify-self-end">
                      <StarIcon className="h-3.5 w-3.5" weight="bold" />
                      Stars
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-right lg:justify-self-end">
                      <DownloadSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                      Accion
                    </span>
                  </div>

                  <div>
                    {marketplaceSkills.map((skill) => (
                      <MarketplaceSkillRow
                        key={skill.id}
                        onOpenDetail={(targetSkill) => {
                          openMarketplaceSkillDetail(targetSkill);
                        }}
                        skill={skill}
                      />
                    ))}
                  </div>
                </>
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
