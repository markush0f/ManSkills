import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";

addCollection(codiconIcons);

type SidebarFooterProps = {
  compact: boolean;
  isMarketplaceView: boolean;
  isSettingsView: boolean;
  openMarketplace: () => void;
  openSettings: () => void;
};

function FooterButton({
  active,
  icon,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  tone: "accent" | "cyan" | "violet";
}) {
  const iconTone =
    tone === "accent"
      ? "text-[var(--accent)]"
      : tone === "cyan"
        ? "text-[var(--cyan)]"
        : "text-[var(--violet)]";

  return (
    <button
      aria-label={label}
      className={`inline-flex h-10 w-full items-center justify-center rounded-[10px] border transition ${
        active
          ? "border-[var(--violet-border)] bg-[linear-gradient(180deg,var(--violet-soft-strong),rgba(255,255,255,0.03))] text-[var(--violet-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className={`inline-flex h-4 w-4 items-center justify-center ${iconTone}`}>
        <Icon icon={icon} className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export function SidebarFooter({
  compact,
  isMarketplaceView,
  isSettingsView,
  openMarketplace,
  openSettings,
}: SidebarFooterProps) {
  return (
    <div className={`border-t border-[var(--border)] ${compact ? "px-2 py-2" : "px-2 py-2"}`}>
      <div className="grid grid-cols-2 gap-2">
        <FooterButton
          active={isMarketplaceView}
          icon="codicon:extensions"
          label="Marketplace"
          onClick={openMarketplace}
          tone="accent"
        />
        <FooterButton
          active={isSettingsView}
          icon="codicon:settings-gear"
          label="Configuracion"
          onClick={openSettings}
          tone="cyan"
        />
      </div>
    </div>
  );
}
