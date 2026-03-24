export const shellPanelClass =
  "bg-[rgba(12,19,25,0.92)]";

export const cardClass =
  "rounded-[16px] border border-[var(--border)] bg-[rgba(16,24,32,0.9)] px-5 py-5";

export const ghostButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/5";

export const accentButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--accent-strong)]";

export const railButtonClass =
  "grid h-12 w-12 place-items-center rounded-[12px] border border-[var(--border)] bg-transparent font-mono text-[11px] tracking-[0.24em] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-white/5";

export const railButtonActiveClass =
  "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]";

export const tabClass =
  "inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-transparent px-4 py-2.5 text-sm text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-white/5 hover:text-[var(--text)]";

export const tabActiveClass = "border-[var(--border)] bg-white/6 text-[var(--text)]";

export const subtleLabelClass =
  "mb-1 text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const panelHeaderTitleClass =
  "text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const listButtonClass =
  "w-full rounded-[10px] border border-transparent bg-transparent p-3 text-left transition hover:border-[var(--border)] hover:bg-white/5";

export function getDiagnosticTone(level: "error" | "warning" | "info") {
  if (level === "error") {
    return "border-[#cf5e4f]/30 bg-[#cf5e4f]/10 text-[#ffb3a7]";
  }

  if (level === "warning") {
    return "border-[#d79432]/30 bg-[#d79432]/10 text-[#ffd08b]";
  }

  return "border-[#4f8f89]/30 bg-[#4f8f89]/10 text-[#a7dfd9]";
}
