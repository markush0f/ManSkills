import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";

addCollection(codiconIcons);

type SidebarFooterProps = {
  isMarketplaceView: boolean;
  isSettingsView: boolean;
  openMarketplace: () => void;
  openSettings: () => void;
  placement?: "footer" | "header";
};

function FooterButton({
  active,
  icon,
  label,
  onClick,
  placement,
  tone,
}: {
  active: boolean;
  icon: string;
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
    ? "bg-white/[0.02] text-[var(--text)]"
    : "bg-transparent text-[var(--muted)] hover:bg-white/[0.01] hover:text-[var(--text)]";
  const footerButtonClass = active
    ? "bg-white/[0.018] text-[var(--text)]"
    : "bg-transparent text-[var(--muted)] hover:bg-white/[0.03] hover:text-[var(--text)]";

  return (
    <button
      aria-label={label}
      className={`relative inline-flex items-center justify-center px-3 transition-colors ${
        placement === "header"
          ? `h-8 w-8 min-w-8 px-0 ${headerButtonClass}`
          : `h-11 min-w-11 rounded-none ${footerButtonClass}`
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className={`inline-flex h-5 w-5 items-center justify-center ${iconTone}`}>
        <Icon icon={icon} className="h-4 w-4" />
      </span>
    </button>
  );
}

export function SidebarFooter({
  isMarketplaceView,
  isSettingsView,
  openMarketplace,
  openSettings,
  placement = "footer",
}: SidebarFooterProps) {
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
            ? "flex items-center gap-0.5"
            : "flex items-center justify-center gap-2 border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] p-1.5"
        }
      >
        <FooterButton
          active={isMarketplaceView}
          icon="codicon:extensions"
          label="Marketplace"
          onClick={openMarketplace}
          placement={placement}
          tone="accent"
        />
        <FooterButton
          active={isSettingsView}
          icon="codicon:settings-gear"
          label="Configuracion"
          onClick={openSettings}
          placement={placement}
          tone="cyan"
        />
      </div>
    </div>
  );
}
