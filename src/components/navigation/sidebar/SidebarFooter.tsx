type SidebarFooterProps = {
  compact: boolean;
  isMarketplaceView: boolean;
  isSettingsView: boolean;
  openMarketplace: () => void;
  openSettings: () => void;
};

function FooterButton({
  active,
  compact,
  label,
  onClick,
  shortLabel,
  suffix,
  tone,
}: {
  active: boolean;
  compact: boolean;
  label: string;
  onClick: () => void;
  shortLabel: string;
  suffix: string;
  tone: "accent" | "cyan" | "violet";
}) {
  const dotTone =
    tone === "accent"
      ? "bg-[var(--accent)]"
      : tone === "cyan"
        ? "bg-[var(--cyan)]"
        : "bg-[var(--violet)]";

  return (
    <button
      className={`flex w-full items-center justify-between rounded-[10px] border px-3 py-2 text-left text-sm transition ${
        active
          ? "border-[var(--violet-border)] bg-[linear-gradient(180deg,var(--violet-soft-strong),rgba(255,255,255,0.03))] text-[var(--violet-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="inline-flex min-w-0 items-center gap-2 truncate">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotTone}`} />
        <span className="truncate">{compact ? shortLabel : label}</span>
      </span>
      {!compact && <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{suffix}</span>}
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
      <div className="space-y-2">
        <FooterButton
          active={isMarketplaceView}
          compact={compact}
          label="Marketplace"
          onClick={openMarketplace}
          shortLabel="MK"
          suffix="Alt"
          tone="accent"
        />
        <FooterButton
          active={isSettingsView}
          compact={compact}
          label="Configuracion"
          onClick={openSettings}
          shortLabel="CFG"
          suffix="Pref"
          tone="cyan"
        />
      </div>
    </div>
  );
}
