import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import type { MarketplaceSkill, SystemSkill } from "../../../types";
import {
  formatUpdatedAt,
  getMarketplaceSkillStateLabel,
  getMarketplaceSkillStateTone,
} from "./marketplaceShared";
import { type MarketplaceSkillState } from "./types";
import { useMarketplace } from "./MarketplaceContext";
import { EmptyState } from "../../shared/EmptyState";
import { ghostButtonClass } from "../../shared/ui";

type MarketplaceSkillCardProps = {
  installedSkill: SystemSkill | null;
  onDelete: (skill: MarketplaceSkill) => void;
  onInstallCommand: (skill: MarketplaceSkill) => void;
  onOpenDetail: (skill: MarketplaceSkill) => void;
  onOpenInstalled: (skill: MarketplaceSkill) => void;
  onReinstall: (skill: MarketplaceSkill) => void;
  onUpdate: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
  state: MarketplaceSkillState;
};

function MarketplaceSkillCard({
  installedSkill: _installedSkill,
  onDelete,
  onInstallCommand,
  onOpenDetail,
  onOpenInstalled,
  onReinstall,
  onUpdate,
  skill,
  state,
}: MarketplaceSkillCardProps) {

  return (
    <article className="group border-b border-[var(--border)] px-4 py-5 transition-colors hover:bg-white/[0.01] last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border)] bg-white/[0.03]">
          <BagSimpleIcon className="h-5 w-5 text-[var(--accent-strong)]" weight="duotone" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                className="min-w-0 text-left"
                onClick={() => onOpenDetail(skill)}
                type="button"
              >
                <h2 className="truncate text-[15px] font-medium leading-tight text-[var(--text)]">
                  {skill.name}
                </h2>
              </button>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                <UserIcon className="h-3 w-3 shrink-0" weight="bold" />
                <span className="truncate">{skill.author}</span>
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${getMarketplaceSkillStateTone(state)}`}
            >
              {getMarketplaceSkillStateLabel(state)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <CalendarBlankIcon className="h-3 w-3" weight="bold" />
              <span>{formatUpdatedAt(skill.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <StarIcon className="h-3 w-3 text-[var(--warning-strong,#f5c451)]" weight="fill" />
              <span>{skill.stars !== null ? skill.stars.toLocaleString("es") : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {state === "not_installed" && (
          <>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:brightness-110"
              onClick={() => onInstallCommand(skill)}
              type="button"
            >
              <DownloadSimpleIcon className="h-4 w-4" weight="bold" />
              Instalar
            </button>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--border-focus)] hover:bg-white/[0.02] hover:text-[var(--text)]"
              onClick={() => onOpenDetail(skill)}
              type="button"
            >
              Detalles
            </button>
          </>
        )}

        {state === "installing" && (
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white/[0.02] px-4 py-2 text-sm text-[var(--muted)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Instalando...
          </span>
        )}

        {state === "updating" && (
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-sm text-[var(--accent-strong)]">
            <ArrowClockwiseIcon className="h-4 w-4 animate-spin" weight="bold" />
            Actualizando...
          </span>
        )}

        {state === "uninstalling" && (
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(207,94,79,0.3)] bg-[rgba(207,94,79,0.1)] px-4 py-2 text-sm text-[#ffb3a7]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Desinstalando...
          </span>
        )}

        {state === "installed" && (
          <>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:brightness-110"
              onClick={() => onOpenInstalled(skill)}
              type="button"
            >
              <CheckCircleIcon className="h-4 w-4" weight="fill" />
              Abrir
            </button>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--border-focus)] hover:bg-white/[0.02] hover:text-[var(--text)]"
              onClick={() => onReinstall(skill)}
              type="button"
            >
              <ArrowClockwiseIcon className="h-4 w-4" weight="bold" />
            </button>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[rgba(207,94,79,0.3)] hover:bg-[rgba(207,94,79,0.05)] hover:text-[#ffb3a7]"
              onClick={() => onDelete(skill)}
              type="button"
            >
              <TrashIcon className="h-4 w-4" weight="bold" />
            </button>
            <button
              className="ml-auto text-[11px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--text)]"
              onClick={() => onOpenDetail(skill)}
              type="button"
            >
              Detalles
            </button>
          </>
        )}

        {state === "update_available" && (
          <>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:brightness-110"
              onClick={() => onUpdate(skill)}
              type="button"
            >
              <ArrowClockwiseIcon className="h-4 w-4" weight="bold" />
              Actualizar
            </button>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--border-focus)] hover:bg-white/[0.02] hover:text-[var(--text)]"
              onClick={() => onOpenInstalled(skill)}
              type="button"
            >
              Abrir
            </button>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[rgba(207,94,79,0.3)] hover:bg-[rgba(207,94,79,0.05)] hover:text-[#ffb3a7]"
              onClick={() => onDelete(skill)}
              type="button"
            >
              <TrashIcon className="h-4 w-4" weight="bold" />
            </button>
            <button
              className="ml-auto text-[11px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--text)]"
              onClick={() => onOpenDetail(skill)}
              type="button"
            >
              Detalles
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function MarketplaceCatalog() {
  const {
    findInstalledMarketplaceSkill,
    getSkillState,
    marketplaceHasSearched,
    marketplaceSkills,
    onUninstall,
    onUpdate,
    openInstallCommand,
    openInstalledMarketplaceSkill,
    openMarketplaceSkillDetail,
    query,
    refreshMarketplace,
    setQuery,
  } = useMarketplace();

  if (marketplaceSkills.length === 0) {
    return marketplaceHasSearched ? (
      <div className="px-4 py-6">
        <EmptyState
          action={
            query.trim().length > 0 ? (
              <button
                className={ghostButtonClass}
                onClick={() => {
                  setQuery("");
                  void refreshMarketplace();
                }}
                type="button"
              >
                Limpiar busqueda
              </button>
            ) : undefined
          }
          eyebrow="Marketplace"
          message="No hay skills que coincidan con la busqueda actual."
          title="Sin resultados"
        />
      </div>
    ) : (
      <div className="px-4 py-6">
        <EmptyState
          eyebrow="Marketplace"
          message="Explora la Skills API local para descubrir e instalar skills."
          title="Buscar skills"
        />
      </div>
    );
  }

  return (
    <div>
      {marketplaceSkills.map((skill) => {
        const installedSkill = findInstalledMarketplaceSkill(skill);
        return (
          <MarketplaceSkillCard
            installedSkill={installedSkill}
            key={skill.id}
            onDelete={onUninstall}
            onInstallCommand={openInstallCommand}
            onOpenDetail={openMarketplaceSkillDetail}
            onOpenInstalled={openInstalledMarketplaceSkill}
            onReinstall={onUpdate}
            onUpdate={onUpdate}
            skill={skill}
            state={getSkillState(skill)}
          />
        );
      })}
    </div>
  );
}