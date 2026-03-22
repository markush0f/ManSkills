import { accentButtonClass } from "../shared/ui";

type TopBarProps = {
  onNewFile: () => void;
};

export function TopBar({ onNewFile }: TopBarProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 rounded-[22px] border border-[var(--border)] bg-[rgba(16,24,32,0.64)] px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
          <span className="rounded-full border border-[var(--border)] bg-white/5 px-2 py-1">Workspace</span>
          <span className="truncate">forja-studio / src</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1
            className="text-xl font-semibold text-[var(--text)] md:text-2xl"
            style={{ fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif' }}
          >
            Editor
          </h1>
          <span className="hidden h-1 w-1 rounded-full bg-[var(--muted)] md:block" />
          <p className="truncate text-sm text-[var(--muted)]">Carpetas a la izquierda, código al centro</p>
        </div>
      </div>

      <button className={accentButtonClass} onClick={onNewFile}>
        Nuevo archivo
      </button>
    </header>
  );
}
