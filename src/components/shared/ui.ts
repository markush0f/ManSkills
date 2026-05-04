export const shellPanelClass =
  "bg-[linear-gradient(180deg,rgba(11,17,22,0.99),rgba(9,14,18,0.995))]";

export const cardClass =
  "rounded-[16px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(16,23,28,0.95),rgba(13,19,24,0.96))] px-5 py-5 shadow-[0_12px_24px_rgba(0,0,0,0.14)]";

export const ghostButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.02]";

export const accentButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-[linear-gradient(180deg,var(--accent-strong),var(--accent))] px-4 py-2.5 text-sm font-semibold text-[#fff8ef] shadow-[0_8px_18px_rgba(217,98,59,0.14)] transition hover:brightness-105";

export const railButtonClass =
  "grid h-12 w-12 place-items-center rounded-[12px] border border-[var(--border)] bg-white/[0.015] font-mono text-[11px] tracking-[0.24em] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.03]";

export const railButtonActiveClass =
  "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)]";

export const tabClass =
  "inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-transparent px-4 py-2.5 text-sm text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-white/[0.02] hover:text-[var(--text)]";

export const tabActiveClass = "border-[var(--border)] bg-white/[0.04] text-[var(--text)]";

export const subtleLabelClass =
  "mb-1 text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const panelHeaderTitleClass =
  "text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const listButtonClass =
  "w-full rounded-[10px] border border-transparent bg-transparent p-3 text-left transition hover:border-[var(--border)] hover:bg-white/[0.02]";

export function getDiagnosticTone(level: "error" | "warning" | "info") {
  if (level === "error") {
    return "border-[#cf5e4f]/30 bg-[#cf5e4f]/10 text-[#ffb3a7]";
  }

  if (level === "warning") {
    return "border-[#d79432]/30 bg-[#d79432]/10 text-[#ffd08b]";
  }

  return "border-[#4f8f89]/30 bg-[#4f8f89]/10 text-[#a7dfd9]";
}
