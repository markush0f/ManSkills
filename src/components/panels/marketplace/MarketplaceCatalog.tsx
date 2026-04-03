import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileTextIcon } from "@phosphor-icons/react/dist/csr/FileText";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import type { MarketplaceSkill, SystemSkill } from "../../../types";
import {
  ActionButton,
  formatUpdatedAt,
  getMarketplaceSkillStateLabel,
  getMarketplaceSkillStateTone,
} from "./marketplaceShared";
import { MARKETPLACE_TABLE_COLUMNS, type MarketplaceSkillState } from "./types";
import { useMarketplace } from "./MarketplaceContext";

type MarketplaceSkillRowProps = {
  installedSkill: SystemSkill | null;
  onDelete: (skill: MarketplaceSkill) => void;
  onOpenDetail: (skill: MarketplaceSkill) => void;
  onOpenInstalled: (skill: MarketplaceSkill) => void;
  onReinstall: (skill: MarketplaceSkill) => void;
  onUpdate: (skill: MarketplaceSkill) => void;
  skill: MarketplaceSkill;
  state: MarketplaceSkillState;
};

function MarketplaceSkillRow({
  installedSkill,
  onDelete,
  onOpenDetail,
  onOpenInstalled,
  onReinstall,
  onUpdate,
  skill,
  state,
}: MarketplaceSkillRowProps) {
  return (
    <article
      className={`grid gap-x-5 gap-y-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 ${MARKETPLACE_TABLE_COLUMNS} lg:items-center`}
    >
      <div className="min-w-0">
        <button className="min-w-0 text-left" onClick={() => onOpenDetail(skill)} type="button">
          <h2 className="flex items-center gap-2 truncate text-[14px] font-medium text-[var(--text)]">
            <BagSimpleIcon className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" weight="duotone" />
            <span className="truncate">{skill.name}</span>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${getMarketplaceSkillStateTone(state)}`}
            >
              {getMarketplaceSkillStateLabel(state)}
            </span>
          </h2>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[var(--muted)]">
            <UserIcon className="h-3.5 w-3.5 shrink-0" weight="bold" />
            <span className="truncate">
              {skill.author} - {skill.repository}
            </span>
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

        {state === "installing" ? <ActionButton disabled>Descargando...</ActionButton> : null}

        {state === "updating" ? (
          <>
            <ActionButton disabled tone="primary">
              Actualizando...
            </ActionButton>
            <ActionButton disabled>Abrir</ActionButton>
          </>
        ) : null}

        {state === "uninstalling" ? (
          <ActionButton disabled tone="danger">
            Eliminando...
          </ActionButton>
        ) : null}

        {state === "installed" ? (
          <>
            <ActionButton onClick={() => onOpenInstalled(skill)} tone="primary">
              Abrir
            </ActionButton>
            <ActionButton onClick={() => onReinstall(skill)}>Reinstalar</ActionButton>
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
            <ActionButton onClick={() => onOpenInstalled(skill)}>Abrir</ActionButton>
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

export function MarketplaceCatalog() {
  const {
    findInstalledMarketplaceSkill,
    getSkillState,
    marketplaceHasSearched,
    marketplaceSkills,
    onUninstall,
    onUpdate,
    openInstalledMarketplaceSkill,
    openMarketplaceSkillDetail,
  } = useMarketplace();

  if (marketplaceSkills.length === 0) {
    return marketplaceHasSearched ? (
      <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
        No hay skills que coincidan con la busqueda actual.
      </div>
    ) : (
      <div className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
        Escribe una busqueda para consultar SkillsMP.
      </div>
    );
  }

  return (
    <>
      <div
        className={`hidden border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:grid ${MARKETPLACE_TABLE_COLUMNS} lg:gap-x-5`}
      >
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
        {marketplaceSkills.map((skill) => {
          const installedSkill = findInstalledMarketplaceSkill(skill);

          return (
            <MarketplaceSkillRow
              installedSkill={installedSkill}
              key={skill.id}
              onDelete={onUninstall}
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
    </>
  );
}
