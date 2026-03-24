import { blueprintItems } from "../../ide/mockData";
import type { CursorPosition, Diagnostic, IdeFile } from "../../types";
import { getLanguageLabel } from "../../ide/utils";
import { panelHeaderTitleClass, shellPanelClass, subtleLabelClass } from "../shared/ui";

type InspectorPanelProps = {
  activeFile: IdeFile;
  cursor: CursorPosition;
  diagnostics: Diagnostic[];
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/5 px-4 py-4">
      <p className={subtleLabelClass}>{label}</p>
      <strong className="text-sm font-medium text-[var(--text)]">{value}</strong>
    </div>
  );
}

export function InspectorPanel({ activeFile, cursor, diagnostics }: InspectorPanelProps) {
  const fileDiagnosticCount = diagnostics.filter((diagnostic) => diagnostic.fileId === activeFile.id).length;

  return (
    <aside className={`${shellPanelClass} relative flex flex-col gap-3 overflow-hidden p-4 xl:min-h-[70vh]`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(239,142,73,0.1),transparent)]" />
      <div className="flex items-center justify-between">
        <p className={panelHeaderTitleClass}>Inspector</p>
        <span className="rounded-full border border-[var(--border)] bg-white/5 px-2.5 py-1 text-xs text-[var(--accent)]">
          {getLanguageLabel(activeFile.language)}
        </span>
      </div>

      <InfoCard label="Selection" value={`Ln ${cursor.line}, Col ${cursor.column}`} />
      <InfoCard label="File health" value={`${fileDiagnosticCount} findings`} />
      <InfoCard
        label="Saved state"
        value={activeFile.content === activeFile.savedContent ? "Synced" : "Modified"}
      />

      <div className="rounded-[24px] border border-[var(--border)] bg-white/5 px-4 py-4">
        <p className={subtleLabelClass}>Blueprint</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          {blueprintItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
