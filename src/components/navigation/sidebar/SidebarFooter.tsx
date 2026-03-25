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
}: {
  active: boolean;
  compact: boolean;
  label: string;
  onClick: () => void;
  shortLabel: string;
  suffix: string;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-[10px] border px-3 py-2 text-left text-sm transition ${
        active
          ? "border-[var(--violet-border)] bg-[var(--violet-soft)] text-[var(--violet-strong)]"
          : "border-[var(--border)] text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="truncate">{compact ? shortLabel : label}</span>
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
        />
        <FooterButton
          active={isSettingsView}
          compact={compact}
          label="Configuracion"
          onClick={openSettings}
          shortLabel="CFG"
          suffix="Pref"
        />
      </div>
    </div>
  );
}
