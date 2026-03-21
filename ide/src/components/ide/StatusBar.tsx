import type { CursorPosition, Diagnostic, IdeFile } from "../../ide/types";
import { getLanguageLabel } from "../../ide/utils";
import { shellPanelClass } from "./ui";

type StatusBarProps = {
  activeFile: IdeFile;
  cursor: CursorPosition;
  diagnostics: Diagnostic[];
};

export function StatusBar({ activeFile, cursor, diagnostics }: StatusBarProps) {
  return (
    <footer
      className={`${shellPanelClass} mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3 text-sm text-[var(--muted)]`}
    >
      <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1">branch main</span>
      <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1">
        {getLanguageLabel(activeFile.language)}
      </span>
      <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1">
        Ln {cursor.line}, Col {cursor.column}
      </span>
      <span className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
        {diagnostics.length} diagnostics
      </span>
    </footer>
  );
}
