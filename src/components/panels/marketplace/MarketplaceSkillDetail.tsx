import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileTextIcon } from "@phosphor-icons/react/dist/csr/FileText";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/csr/FolderSimple";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/csr/LinkSimple";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { MarkdownPreview } from "../../editor/MarkdownPreview";
import { SkeletonBlock } from "../../shared/SkeletonBlock";
import {
  ActionButton,
  DetailMeta,
  formatUpdatedAt,
  getMarketplaceSkillStateLabel,
  getMarketplaceSkillStateTone,
} from "./marketplaceShared";
import { useMarketplace } from "./MarketplaceContext";

export function MarketplaceSkillDetail() {
  const {
    closeMarketplaceSkillDetail,
    installMarketplaceSkill,
    selectedSkillManifest,
    selectedSkillManifestError,
    selectedSkillManifestLoading,
    onUninstall,
    onUpdate,
    openInstalledMarketplaceSkill,
    selectedCollectionLabel,
    selectedInstalledCollectionLabel,
    selectedInstalledPath,
    selectedInstalledTargetLabel,
    selectedMarketplaceSkill,
    selectedSkillState,
    selectedTargetLabel,
  } = useMarketplace();

  if (!selectedMarketplaceSkill) {
    return null;
  }

  const skill = selectedMarketplaceSkill;

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
            <ActionButton onClick={() => installMarketplaceSkill(skill)} tone="primary">
              <DownloadSimpleIcon className="mr-2 h-4 w-4" weight="bold" />
              Descargar
            </ActionButton>
          ) : null}
          {selectedSkillState === "installing" ? <ActionButton disabled>Descargando...</ActionButton> : null}
          {selectedSkillState === "installed" ? (
            <>
              <ActionButton onClick={() => openInstalledMarketplaceSkill(skill)} tone="primary">
                Abrir
              </ActionButton>
              <ActionButton onClick={() => onUpdate(skill)}>Reinstalar</ActionButton>
              <ActionButton onClick={() => onUninstall(skill)} tone="danger">
                <TrashIcon className="mr-2 h-4 w-4" weight="bold" />
                Desinstalar
              </ActionButton>
            </>
          ) : null}
          {selectedSkillState === "update_available" ? (
            <>
              <ActionButton onClick={() => onUpdate(skill)} tone="primary">
                <ArrowClockwiseIcon className="mr-2 h-4 w-4" weight="bold" />
                Actualizar
              </ActionButton>
              <ActionButton onClick={() => openInstalledMarketplaceSkill(skill)}>Abrir</ActionButton>
              <ActionButton onClick={() => onUninstall(skill)} tone="danger">
                <TrashIcon className="mr-2 h-4 w-4" weight="bold" />
                Desinstalar
              </ActionButton>
            </>
          ) : null}
          {selectedSkillState === "updating" ? <ActionButton disabled>Actualizando...</ActionButton> : null}
          {selectedSkillState === "uninstalling" ? (
            <ActionButton disabled tone="danger">
              Eliminando...
            </ActionButton>
          ) : null}
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
                <h2 className="text-[28px] font-medium leading-tight text-[var(--text)]">{skill.name}</h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${getMarketplaceSkillStateTone(selectedSkillState)}`}
                >
                  {getMarketplaceSkillStateLabel(selectedSkillState)}
                </span>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
                <UserIcon className="h-4 w-4 shrink-0" weight="bold" />
                <span>{skill.author}</span>
                <span className="text-[var(--border-strong)]">/</span>
                <span className="break-all">{skill.repository}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            <DetailMeta
              icon={<StarIcon className="h-3.5 w-3.5" weight="fill" />}
              label="Stars"
              value={skill.stars !== null ? String(skill.stars) : "Sin stars"}
            />
            <DetailMeta
              icon={<CalendarBlankIcon className="h-3.5 w-3.5" weight="bold" />}
              label="Updated"
              value={formatUpdatedAt(skill.updatedAt)}
            />
            <DetailMeta
              icon={<SealCheckIcon className="h-3.5 w-3.5" weight="duotone" />}
              label="Slug"
              value={skill.slug}
            />
            <DetailMeta
              icon={<FolderSimpleIcon className="h-3.5 w-3.5" weight="bold" />}
              label="Target"
              value={selectedInstalledTargetLabel}
            />
          </div>

          <div className="mt-5 rounded-[16px] border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              <FileTextIcon className="h-3.5 w-3.5" weight="bold" />
              <span>Resumen completo</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-7 text-[var(--text)]">
              {skill.summary}
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
              <div className="px-5 py-5 text-[13px] text-[#ffb3a7]">{selectedSkillManifestError}</div>
            ) : null}
            {!selectedSkillManifestError && selectedSkillManifestLoading ? (
              <div className="space-y-3 px-5 py-8">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-[92%]" />
                <SkeletonBlock className="h-3 w-[85%]" />
                <SkeletonBlock className="h-3 w-[90%]" />
              </div>
            ) : null}
            {!selectedSkillManifestError && !selectedSkillManifestLoading && selectedSkillManifest ? (
              <div className="min-h-[420px]">
                <MarkdownPreview compact content={selectedSkillManifest} />
              </div>
            ) : null}
            {!selectedSkillManifestError && !selectedSkillManifestLoading && !selectedSkillManifest ? (
              <div className="px-5 py-8 text-[13px] text-[var(--muted)]">
                No hay contenido disponible para SKILL.md.
              </div>
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
                  {selectedTargetLabel} / {selectedCollectionLabel} / {skill.slug}
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
              {skill.githubUrl ? (
                <a
                  className="rounded-[14px] border border-[var(--border)] px-4 py-3 text-[13px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.02]"
                  href={skill.githubUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="flex items-center gap-2">
                    <LinkSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="bold" />
                    <span>Ver fuente en GitHub</span>
                  </div>
                  <p className="mt-2 break-all text-[12px] leading-5 text-[var(--muted)]">{skill.githubUrl}</p>
                </a>
              ) : null}

              {skill.skillUrl ? (
                <a
                  className="rounded-[14px] border border-[var(--border)] px-4 py-3 text-[13px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.02]"
                  href={skill.skillUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="flex items-center gap-2">
                    <LinkSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="bold" />
                    <span>Abrir pagina en SkillsMP</span>
                  </div>
                  <p className="mt-2 break-all text-[12px] leading-5 text-[var(--muted)]">{skill.skillUrl}</p>
                </a>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
