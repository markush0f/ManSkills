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
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, type ReactNode } from "react";
import { useIde } from "../../contexts/IdeContext";
import type { MarketplaceInstallTarget, MarketplaceSkill, SystemSkill } from "../../types";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import { SelectInput, TextInput } from "../shared/formControls";
import { ghostButtonClass, shellPanelClass } from "../shared/ui";
import { MarketplaceTabsHeader } from "./MarketplaceTabsHeader";

const INSTALL_TARGET_OPTIONS: Array<{ label: string; value: MarketplaceInstallTarget }> = [
  { label: "Codex", value: "codex" },
  { label: "Claude", value: "claude" },
  { label: "Workspace", value: "workspace" },
];
const MARKETPLACE_TABLE_COLUMNS = "lg:grid-cols-[minmax(280px,0.95fr)_minmax(420px,1.5fr)_170px_120px_240px]";

type MarketplaceSkillState =
  | "not_installed"
  | "installed"
  | "update_available"
  | "installing"
  | "updating"
  | "uninstalling";

function parseMarketplaceTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  const normalizedDate = Number.isNaN(seconds) ? new Date(value) : new Date(seconds * 1000);

  if (Number.isNaN(normalizedDate.getTime())) {
    return null;
  }

  return normalizedDate.getTime();
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const timestamp = parseMarketplaceTimestamp(value);
  if (timestamp === null) {
    return value;
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function getMarketplaceSkillStateTone(state: MarketplaceSkillState) {
  if (state === "update_available") {
    return "border-[rgba(217,148,50,0.18)] bg-[rgba(217,148,50,0.08)] text-[#ffd08b]";
  }

  if (state === "installed") {
    return "border-[rgba(79,168,199,0.18)] bg-[rgba(79,168,199,0.08)] text-[#9dd8d1]";
  }

  if (state === "installing" || state === "updating" || state === "uninstalling") {
    return "border-[rgba(138,108,230,0.18)] bg-[rgba(138,108,230,0.08)] text-[var(--violet-strong)]";
  }

  return "border-[var(--border)] bg-white/[0.03] text-[var(--muted)]";
}

function getMarketplaceSkillStateLabel(state: MarketplaceSkillState) {
  switch (state) {
    case "installed":
      return "Instalada";
    case "update_available":
      return "Update";
    case "installing":
      return "Instalando";
    case "updating":
      return "Actualizando";
    case "uninstalling":
      return "Eliminando";
    default:
      return "Nueva";
  }
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

function ActionButton({
  children,
  disabled,
  onClick,
  tone = "secondary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tone?: "primary" | "secondary" | "danger";
}) {
  const toneClass = tone === "primary"
    ? "border-[var(--border-strong)] text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
    : tone === "danger"
      ? "border-[rgba(207,94,79,0.28)] text-[#ffb3a7] hover:bg-[rgba(207,94,79,0.08)]"
      : "border-[var(--border)] text-[var(--muted)] hover:bg-white/[0.03] hover:text-[var(--text)]";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-[10px] border px-3 py-2 text-sm transition ${disabled ? "cursor-not-allowed opacity-60" : toneClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function MarketplaceSkillRow({
  installedSkill,
  onDelete,
  onOpenDetail,
  onOpenInstalled,
  onReinstall,
  onUpdate,
  skill,
  state,
}: {
  installedSkill: SystemSkill | null;
  onDelete: (skill: MarketplaceSkill) => void;
  onOpenDetail: (skill: MarketplaceSkill) => void;
  onOpenInstalled: (skill: MarketplaceSkill) => void;
  onReinstall: (skill: MarketplaceSkill) => void;
  onUpdate: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
  state: MarketplaceSkillState;
}) {
  return (
    <article className={`grid gap-x-5 gap-y-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 ${MARKETPLACE_TABLE_COLUMNS} lg:items-center`}>
      <div className="min-w-0">
        <button className="min-w-0 text-left" onClick={() => onOpenDetail(skill)} type="button">
          <h2 className="flex items-center gap-2 truncate text-[14px] font-medium text-[var(--text)]">
            <BagSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="duotone" />
            <span className="truncate">{skill.name}</span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${getMarketplaceSkillStateTone(state)}`}>
              {getMarketplaceSkillStateLabel(state)}
            </span>
          </h2>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[var(--muted)]">
            <UserIcon className="h-3.5 w-3.5 shrink-0" weight="bold" />
            <span className="truncate">{skill.author} - {skill.repository}</span>
          </p>
        </button>
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

      <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-self-end">
        {state === "not_installed" ? (
          <ActionButton onClick={() => onOpenDetail(skill)} tone="primary">
            <DownloadSimpleIcon className="mr-2 h-4 w-4" weight="bold" />
            Descargar
          </ActionButton>
        ) : null}

        {state === "installing" ? (
          <ActionButton disabled onClick={() => undefined}>
            Descargando...
          </ActionButton>
        ) : null}

        {state === "updating" ? (
          <>
            <ActionButton disabled onClick={() => undefined} tone="primary">
              Actualizando...
            </ActionButton>
            <ActionButton disabled onClick={() => undefined}>
              Abrir
            </ActionButton>
          </>
        ) : null}

        {state === "uninstalling" ? (
          <ActionButton disabled onClick={() => undefined} tone="danger">
            Eliminando...
          </ActionButton>
        ) : null}

        {state === "installed" ? (
          <>
            <ActionButton onClick={() => onOpenInstalled(skill)} tone="primary">
              Abrir
            </ActionButton>
            <ActionButton onClick={() => onReinstall(skill)}>
              Reinstalar
            </ActionButton>
            <ActionButton onClick={() => onDelete(skill)} tone="danger">
              <TrashIcon className="mr-2 h-4 w-4" weight="bold" />
              Desinstalar
            </ActionButton>
          </>
        ) : null}

        {state === "update_available" ? (
          <>
            <ActionButton onClick={() => onUpdate(skill)} tone="primary">
              <ArrowClockwiseIcon className="mr-2 h-4 w-4" weight="bold" />
              Actualizar
            </ActionButton>
            <ActionButton onClick={() => onOpenInstalled(skill)}>
              Abrir
            </ActionButton>
            <ActionButton onClick={() => onDelete(skill)} tone="danger">
              <TrashIcon className="mr-2 h-4 w-4" weight="bold" />
              Desinstalar
            </ActionButton>
          </>
        ) : null}

        {installedSkill && state !== "not_installed" ? (
          <button
            className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-[var(--text)]"
            onClick={() => onOpenDetail(skill)}
            type="button"
          >
            Detalles
          </button>
        ) : null}
      </div>
    </article>
  );
}

function renderMarketplaceBody({
  closeMarketplaceSkillDetail,
  findInstalledMarketplaceSkill,
  getSkillState,
  marketplaceError,
  marketplaceHasSearched,
  marketplaceLoading,
  marketplaceSkills,
  onDelete,
  onOpenDetail,
  onOpenInstalled,
  onReinstall,
  onUpdate,
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
  submitInstall,
  submitOpenInstalled,
  submitUninstall,
  submitUpdate,
}: {
  closeMarketplaceSkillDetail: () => void;
  findInstalledMarketplaceSkill: (skill: MarketplaceSkill) => SystemSkill | null;
  getSkillState: (skill: MarketplaceSkill) => MarketplaceSkillState;
  marketplaceError: string | null;
  marketplaceHasSearched: boolean;
  marketplaceLoading: boolean;
  marketplaceSkills: MarketplaceSkill[];
  onDelete: (skill: MarketplaceSkill) => void;
  onOpenDetail: (skill: MarketplaceSkill) => void;
  onOpenInstalled: (skill: MarketplaceSkill) => void;
  onReinstall: (skill: MarketplaceSkill) => void;
  onUpdate: (skill: MarketplaceSkill) => void;
  selectedCollectionLabel: string;
  selectedInstalledCollectionLabel: string;
  selectedInstalledPath: string | null;
  selectedInstalledTargetLabel: string;
  selectedMarketplaceSkill: MarketplaceSkill | null;
  selectedSkillManifest: string;
  selectedSkillManifestError: string | null;
  selectedSkillManifestLoading: boolean;
  selectedSkillState: MarketplaceSkillState;
  selectedTargetLabel: string;
  submitInstall: (skill: MarketplaceSkill) => void;
  submitOpenInstalled: (skill: MarketplaceSkill) => void;
  submitUninstall: (skill: MarketplaceSkill) => void;
  submitUpdate: (skill: MarketplaceSkill) => void;
}) {
  if (marketplaceError) {
    return (
      <div className="px-4 py-4 text-[13px] text-[#ffb3a7]">
        {marketplaceError}
      </div>
    );
  }

  if (marketplaceLoading) {
    return (
      <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
        Cargando catalogo...
      </div>
    );
  }

  if (selectedMarketplaceSkill) {
    return (
      <div className="px-4 py-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <button
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-[var(--text)]"
            onClick={closeMarketplaceSkillDetail}
            type="button"
          >
            <ArrowLeftIcon className="h-4 w-4" weight="bold" />
            Volver al catalogo
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSkillState === "not_installed" ? (
              <ActionButton onClick={() => submitInstall(selectedMarketplaceSkill)} tone="primary">
                <DownloadSimpleIcon className="mr-2 h-4 w-4" weight="bold" />
                Descargar
              </ActionButton>
            ) : null}
            {selectedSkillState === "installing" ? <ActionButton disabled onClick={() => undefined}>Descargando...</ActionButton> : null}
            {selectedSkillState === "installed" ? (
              <>
                <ActionButton onClick={() => submitOpenInstalled(selectedMarketplaceSkill)} tone="primary">Abrir</ActionButton>
                <ActionButton onClick={() => submitUpdate(selectedMarketplaceSkill)}>Reinstalar</ActionButton>
                <ActionButton onClick={() => submitUninstall(selectedMarketplaceSkill)} tone="danger">
                  <TrashIcon className="mr-2 h-4 w-4" weight="bold" />
                  Desinstalar
                </ActionButton>
              </>
            ) : null}
            {selectedSkillState === "update_available" ? (
              <>
                <ActionButton onClick={() => submitUpdate(selectedMarketplaceSkill)} tone="primary">
                  <ArrowClockwiseIcon className="mr-2 h-4 w-4" weight="bold" />
                  Actualizar
                </ActionButton>
                <ActionButton onClick={() => submitOpenInstalled(selectedMarketplaceSkill)}>Abrir</ActionButton>
                <ActionButton onClick={() => submitUninstall(selectedMarketplaceSkill)} tone="danger">
                  <TrashIcon className="mr-2 h-4 w-4" weight="bold" />
                  Desinstalar
                </ActionButton>
              </>
            ) : null}
            {selectedSkillState === "updating" ? <ActionButton disabled onClick={() => undefined}>Actualizando...</ActionButton> : null}
            {selectedSkillState === "uninstalling" ? <ActionButton disabled onClick={() => undefined} tone="danger">Eliminando...</ActionButton> : null}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="min-w-0">
            <div className="flex items-start gap-3 border-b border-[var(--border)] pb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] text-[var(--accent-strong)]">
                <BagSimpleIcon className="h-5 w-5" weight="duotone" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[28px] font-medium leading-tight text-[var(--text)]">
                    {selectedMarketplaceSkill.name}
                  </h2>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${getMarketplaceSkillStateTone(selectedSkillState)}`}>
                    {getMarketplaceSkillStateLabel(selectedSkillState)}
                  </span>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
                  <UserIcon className="h-4 w-4 shrink-0" weight="bold" />
                  <span>{selectedMarketplaceSkill.author}</span>
                  <span className="text-[var(--border-strong)]">/</span>
                  <span className="break-all">{selectedMarketplaceSkill.repository}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <DetailMeta icon={<StarIcon className="h-3.5 w-3.5" weight="fill" />} label="Stars" value={selectedMarketplaceSkill.stars !== null ? String(selectedMarketplaceSkill.stars) : "Sin stars"} />
              <DetailMeta icon={<CalendarBlankIcon className="h-3.5 w-3.5" weight="bold" />} label="Updated" value={formatUpdatedAt(selectedMarketplaceSkill.updatedAt)} />
              <DetailMeta icon={<SealCheckIcon className="h-3.5 w-3.5" weight="duotone" />} label="Slug" value={selectedMarketplaceSkill.slug} />
              <DetailMeta icon={<FolderSimpleIcon className="h-3.5 w-3.5" weight="bold" />} label="Target" value={selectedInstalledTargetLabel} />
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

              {selectedSkillManifestError ? <div className="px-5 py-5 text-[13px] text-[#ffb3a7]">{selectedSkillManifestError}</div> : null}
              {!selectedSkillManifestError && selectedSkillManifestLoading ? <div className="px-5 py-8 text-[13px] text-[var(--muted)]">Cargando SKILL.md...</div> : null}
              {!selectedSkillManifestError && !selectedSkillManifestLoading && selectedSkillManifest ? (
                <div className="min-h-[420px]">
                  <MarkdownPreview compact content={selectedSkillManifest} />
                </div>
              ) : null}
              {!selectedSkillManifestError && !selectedSkillManifestLoading && !selectedSkillManifest ? (
                <div className="px-5 py-8 text-[13px] text-[var(--muted)]">No hay contenido disponible para SKILL.md.</div>
              ) : null}
            </div>
          </div>

          <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-[16px] border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                <DownloadSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                <span>Instalacion</span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[var(--muted)]">
                {selectedSkillState === "not_installed"
                  ? `Se instalara en ${selectedTargetLabel} / ${selectedCollectionLabel}.`
                  : `Actualmente instalada en ${selectedInstalledTargetLabel} / ${selectedInstalledCollectionLabel}.`}
              </p>

              {selectedInstalledPath ? (
                <div className="mt-4 rounded-[14px] border border-[var(--border)] px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    <FolderSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                    <span>Installed path</span>
                  </div>
                  <p className="mt-2 break-all text-[12px] leading-5 text-[var(--text)]">{selectedInstalledPath}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-[14px] border border-[var(--border)] px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    <FolderSimpleIcon className="h-3.5 w-3.5" weight="bold" />
                    <span>Destino relativo</span>
                  </div>
                  <p className="mt-2 break-all text-[12px] leading-5 text-[var(--text)]">
                    {selectedTargetLabel} / {selectedCollectionLabel} / {selectedMarketplaceSkill.slug}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[16px] border border-[var(--border)] p-5">
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
                    <p className="mt-2 break-all text-[12px] leading-5 text-[var(--muted)]">{selectedMarketplaceSkill.githubUrl}</p>
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
                    <p className="mt-2 break-all text-[12px] leading-5 text-[var(--muted)]">{selectedMarketplaceSkill.skillUrl}</p>
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (marketplaceSkills.length > 0) {
    return (
      <>
        <div className={`hidden border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:grid ${MARKETPLACE_TABLE_COLUMNS} lg:gap-x-5`}>
          <span className="inline-flex items-center gap-1.5"><BagSimpleIcon className="h-3.5 w-3.5" weight="bold" />Skill</span>
          <span className="inline-flex items-center gap-1.5"><FileTextIcon className="h-3.5 w-3.5" weight="bold" />Resumen</span>
          <span className="inline-flex items-center gap-1.5"><CalendarBlankIcon className="h-3.5 w-3.5" weight="bold" />Updated</span>
          <span className="inline-flex items-center gap-1.5 lg:justify-self-end"><StarIcon className="h-3.5 w-3.5" weight="bold" />Stars</span>
          <span className="inline-flex items-center gap-1.5 text-right lg:justify-self-end"><DownloadSimpleIcon className="h-3.5 w-3.5" weight="bold" />Accion</span>
        </div>

        <div>
          {marketplaceSkills.map((skill) => {
            const installedSkill = findInstalledMarketplaceSkill(skill);
            return (
              <MarketplaceSkillRow
                installedSkill={installedSkill}
                key={skill.id}
                onDelete={onDelete}
                onOpenDetail={onOpenDetail}
                onOpenInstalled={onOpenInstalled}
                onReinstall={onReinstall}
                onUpdate={onUpdate}
                skill={skill}
                state={getSkillState(skill)}
              />
            );
          })}
        </div>
      </>
    );
  }

  if (!marketplaceHasSearched) {
    return <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">Escribe una busqueda para consultar SkillsMP.</div>;
  }

  return <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">No hay skills que coincidan con la busqueda actual.</div>;
}

export function MarketplaceWorkspace() {
  const {
    closeFile,
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
    openEditor,
    openFile,
    openFiles,
    openInstalledMarketplaceSkill,
    openMarketplace,
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

              {renderMarketplaceBody({
                findInstalledMarketplaceSkill,
                getSkillState,
                marketplaceError,
                marketplaceHasSearched,
                marketplaceLoading,
                marketplaceSkills,
                onDelete: confirmAndUninstall,
                onOpenDetail: openMarketplaceSkillDetail,
                onOpenInstalled: openInstalledMarketplaceSkill,
                onReinstall: (skill) => {
                  void updateMarketplaceSkill(skill);
                },
                onUpdate: (skill) => {
                  void updateMarketplaceSkill(skill);
                },
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
                submitInstall: (skill) => {
                  void installMarketplaceSkill(skill);
                },
                submitOpenInstalled: openInstalledMarketplaceSkill,
                submitUninstall: confirmAndUninstall,
                submitUpdate: (skill) => {
                  void updateMarketplaceSkill(skill);
                },
                closeMarketplaceSkillDetail,
              })}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
