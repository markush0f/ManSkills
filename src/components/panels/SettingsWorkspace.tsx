import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import type { SystemSkillTreeNode } from "../../ide/types";
import { shellPanelClass } from "../shared/ui";

function countSkills(nodes: SystemSkillTreeNode[]): number {
  return nodes.reduce((total, node) => {
    const current = node.kind === "skill" ? 1 : 0;
    return total + current + countSkills(node.children);
  }, 0);
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-[var(--text)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      </div>

      <button
        aria-pressed={checked}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition ${
          checked
            ? "border-[var(--border-strong)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] bg-transparent"
        }`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition ${
            checked
              ? "left-[22px] bg-[var(--accent)]"
              : "left-[4px] bg-[var(--muted)]"
          }`}
        />
      </button>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--text)]">{value}</p>
    </div>
  );
}

export function SettingsWorkspace() {
  const {
    activeFile,
    openFiles,
    preferences,
    systemSkillScanMs,
    systemSkillTree,
    updatePreferences,
  } = useIde();
  const { resetSidebarWidth, sidebarWidth } = useIdeLayout();
  const systemSkillCount = countSkills(systemSkillTree);

  return (
    <section className={`${shellPanelClass} grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden`}>
      <div className="border-b border-[var(--border)] bg-[rgba(4,8,12,0.94)] px-5 py-4">
        <h1 className="text-sm text-[var(--text)]">Configuracion</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">Preferencias del editor, layout y estado actual del workspace.</p>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="grid gap-6 px-5 py-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white/[0.015]">
              <div className="border-b border-[var(--border)] px-5 py-3">
                <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Editor</h2>
              </div>

              <ToggleRow
                checked={preferences.cursorAnimation}
                description="Suaviza el desplazamiento del cursor mientras escribes."
                label="Animacion del cursor"
                onChange={(value) => updatePreferences({ cursorAnimation: value })}
              />
              <ToggleRow
                checked={preferences.fontLigatures}
                description="Activa ligaduras tipograficas cuando la fuente las soporta."
                label="Ligaduras tipograficas"
                onChange={(value) => updatePreferences({ fontLigatures: value })}
              />
              <ToggleRow
                checked={preferences.markdownWordWrap}
                description="Ajusta automaticamente las lineas largas al editar markdown."
                label="Word wrap en markdown"
                onChange={(value) => updatePreferences({ markdownWordWrap: value })}
              />
            </section>

            <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white/[0.015]">
              <div className="border-b border-[var(--border)] px-5 py-3">
                <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Sidebar</h2>
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm text-[var(--text)]">Ancho actual</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{sidebarWidth}px</p>
                </div>

                <button
                  className="rounded-[8px] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
                  onClick={resetSidebarWidth}
                  type="button"
                >
                  Restaurar ancho
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <Metric label="Archivo activo" value={activeFile.path} />
            <Metric label="Pestanas abiertas" value={String(openFiles.length)} />
            <Metric label="Skills cargadas" value={String(systemSkillCount)} />
            <Metric
              label="Ultimo escaneo"
              value={systemSkillScanMs === null ? "Sin datos" : `${systemSkillScanMs} ms`}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
