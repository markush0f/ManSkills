export const shellPanelClass =
  "rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl";

export const cardClass =
  "rounded-[26px] border border-[var(--border)] bg-[var(--panel)] px-5 py-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl";

export const ghostButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/8";

export const accentButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-[var(--border-strong)] bg-[linear-gradient(160deg,var(--accent),var(--accent-strong))] px-4 py-2.5 text-sm font-semibold text-[#fff8ef] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(217,98,59,0.22)]";

export const railButtonClass =
  "grid h-12 w-12 place-items-center rounded-full border border-[var(--border)] bg-white/5 font-mono text-[11px] tracking-[0.24em] text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/8";

export const railButtonActiveClass =
  "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_10px_24px_rgba(217,98,59,0.16)]";

export const tabClass =
  "inline-flex items-center gap-2 rounded-full border border-transparent bg-white/5 px-4 py-2.5 text-sm text-[var(--text)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/8";

export const tabActiveClass = "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]";

export const subtleLabelClass =
  "mb-1 text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const panelHeaderTitleClass =
  "text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const listButtonClass =
  "w-full rounded-[22px] border border-transparent bg-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/8";

export function getDiagnosticTone(level: "error" | "warning" | "info") {
  if (level === "error") {
    return "border-[#cf5e4f]/30 bg-[#cf5e4f]/10 text-[#ffb3a7]";
  }

  if (level === "warning") {
    return "border-[#d79432]/30 bg-[#d79432]/10 text-[#ffd08b]";
  }

  return "border-[#4f8f89]/30 bg-[#4f8f89]/10 text-[#a7dfd9]";
}
