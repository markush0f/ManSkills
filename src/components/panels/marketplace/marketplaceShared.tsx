import { type ReactNode } from "react";
import type { MarketplaceSkillState } from "./types";

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

export function formatUpdatedAt(value: string | null) {
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

export function getMarketplaceSkillStateTone(state: MarketplaceSkillState) {
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

export function getMarketplaceSkillStateLabel(state: MarketplaceSkillState) {
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

type DetailMetaProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export function DetailMeta({ icon, label, value }: DetailMetaProps) {
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

type ActionButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  tone?: "primary" | "secondary" | "danger";
};

export function ActionButton({
  children,
  disabled,
  onClick,
  size = "md",
  tone = "secondary",
}: ActionButtonProps) {
  const toneClass =
    tone === "primary"
      ? "border-[var(--border-strong)] text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
      : tone === "danger"
        ? "border-[rgba(207,94,79,0.28)] text-[#ffb3a7] hover:bg-[rgba(207,94,79,0.08)]"
        : "border-[var(--border)] text-[var(--muted)] hover:bg-white/[0.03] hover:text-[var(--text)]";

  const sizeClass = size === "sm" ? "px-2 py-1.5 text-xs gap-1.5" : "px-3 py-2 text-sm gap-2";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-[10px] border transition ${disabled ? "cursor-not-allowed opacity-60" : toneClass} ${sizeClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
