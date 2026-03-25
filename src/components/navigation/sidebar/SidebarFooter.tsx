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
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-[12px] px-3 transition ${
        active
          ? "bg-[linear-gradient(180deg,var(--violet-soft-strong),rgba(255,255,255,0.03))] text-[var(--violet-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
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
            ? "flex items-center gap-2"
            : "flex items-center justify-center gap-2 rounded-[14px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        }
      >
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
