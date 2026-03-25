export const shellPanelClass =
  "bg-[linear-gradient(180deg,rgba(7,11,16,0.98),rgba(6,10,14,0.99))]";

export const cardClass =
  "rounded-[16px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(17,25,34,0.94),rgba(12,19,26,0.94))] px-5 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]";

export const ghostButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]";

export const accentButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-[linear-gradient(180deg,var(--accent-strong),var(--accent))] px-4 py-2.5 text-sm font-semibold text-[#fff8ef] shadow-[0_10px_24px_rgba(217,98,59,0.18)] transition hover:brightness-105";

export const railButtonClass =
  "grid h-12 w-12 place-items-center rounded-[12px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.005))] font-mono text-[11px] tracking-[0.24em] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-white/5";

export const railButtonActiveClass =
  "border-[var(--border-strong)] bg-[linear-gradient(180deg,var(--accent-soft-strong),rgba(255,255,255,0.03))] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export const tabClass =
  "inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-transparent px-4 py-2.5 text-sm text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] hover:text-[var(--text)]";

export const tabActiveClass = "border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export const subtleLabelClass =
  "mb-1 text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const panelHeaderTitleClass =
  "text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]";

export const listButtonClass =
  "w-full rounded-[10px] border border-transparent bg-transparent p-3 text-left transition hover:border-[var(--border)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))]";

export function getDiagnosticTone(level: "error" | "warning" | "info") {
  if (level === "error") {
    return "border-[#cf5e4f]/30 bg-[#cf5e4f]/10 text-[#ffb3a7]";
  }

  if (level === "warning") {
    return "border-[#d79432]/30 bg-[#d79432]/10 text-[#ffd08b]";
  }

  return "border-[#4f8f89]/30 bg-[#4f8f89]/10 text-[#a7dfd9]";
}
