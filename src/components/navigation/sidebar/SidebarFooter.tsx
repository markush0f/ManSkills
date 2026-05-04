import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { BagSimpleIcon } from "@phosphor-icons/react/dist/csr/BagSimple";
import { FunnelSimpleIcon } from "@phosphor-icons/react/dist/csr/FunnelSimple";
import type { ReactNode } from "react";
import { useIde } from "../../../contexts/IdeContext";

function FooterButton({
  active,
  icon,
  label,
  onClick,
  placement,
  tone,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  placement: "footer" | "header";
  tone: "accent" | "cyan" | "violet";
}) {
  const iconTone =
    tone === "accent"
      ? "text-[var(--accent)]"
      : tone === "cyan"
        ? "text-[var(--cyan)]"
        : "text-[var(--violet)]";
  const headerButtonClass = active
    ? "border-white/[0.06] bg-white/[0.028] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
    : "border-transparent bg-transparent text-[var(--muted)] hover:border-white/[0.03] hover:bg-white/[0.015] hover:text-[var(--text)]";
  const footerButtonClass = active
    ? "border-white/[0.06] bg-white/[0.022] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
    : "border-transparent bg-transparent text-[var(--muted)] hover:border-white/[0.04] hover:bg-white/[0.03] hover:text-[var(--text)]";

  return (
    <button
      aria-label={label}
      className={`relative inline-flex items-center justify-center border px-3 transition-colors ${
        placement === "header"
          ? `h-8 w-8 min-w-8 rounded-[10px] px-0 ${headerButtonClass}`
          : `h-11 min-w-11 rounded-[10px] ${footerButtonClass}`
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className={`inline-flex h-5 w-5 items-center justify-center ${iconTone}`}>
        {icon}
      </span>
    </button>
  );
}

export function SidebarFooter({
  placement = "footer",
  onOpenFilters,
  filtersActive = false,
}: {
  placement?: "footer" | "header";
  onOpenFilters?: () => void;
  filtersActive?: boolean;
}) {
  const { isMarketplaceView, isSettingsView, openMarketplace, openSettings } = useIde();
  const isHeader = placement === "header";

  return (
    <div
      className={
        isHeader
          ? "shrink-0"
          : "border-t border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.005))] px-2 py-2"
      }
    >
      <div
        className={
          isHeader
            ? "flex items-center justify-end gap-1"
            : "flex items-center justify-center gap-2 rounded-[12px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] p-1.5"
        }
      >
        {onOpenFilters && (
          <FooterButton
            active={filtersActive}
            icon={<FunnelSimpleIcon className="h-[18px] w-[18px]" weight="duotone" />}
            label="Filtros"
            onClick={onOpenFilters}
            placement={placement}
            tone="accent"
          />
        )}
        <FooterButton
          active={isMarketplaceView}
          icon={<BagSimpleIcon className="h-[18px] w-[18px]" weight="duotone" />}
          label="Marketplace"
          onClick={openMarketplace}
          placement={placement}
          tone="violet"
        />
        <FooterButton
          active={isSettingsView}
          icon={<GearSixIcon className="h-[18px] w-[18px]" weight="duotone" />}
          label="Configuracion"
          onClick={openSettings}
          placement={placement}
          tone="cyan"
        />
      </div>
    </div>
  );
}
