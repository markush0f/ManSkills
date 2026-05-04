import { useEffect, useRef, useState } from "react";
import { FunnelSimpleIcon } from "@phosphor-icons/react/dist/csr/FunnelSimple";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useIde } from "../../../contexts/IdeContext";

type SystemSkillFiltersModalProps = {
  onClose: () => void;
};

export function SystemSkillFiltersModal({ onClose }: SystemSkillFiltersModalProps) {
  const { preferences, updatePreferences } = useIde();
  const [onlyGitProjects, setOnlyGitProjects] = useState(preferences.systemSkillsOnlyGitProjects);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleApply() {
    updatePreferences({ systemSkillsOnlyGitProjects: onlyGitProjects });
    onClose();
  }

  function handleReset() {
    setOnlyGitProjects(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Filtros de System Skills"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div className="flex w-[min(420px,calc(100vw-2rem))] flex-col rounded-[16px] border border-white/[0.08] bg-[var(--sidebar-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <FunnelSimpleIcon className="h-5 w-5 text-[var(--accent)]" weight="duotone" />
            <h2 className="text-[15px] font-semibold text-[var(--text)]">Filtros de Skills</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-transparent text-[var(--muted)] transition hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-[var(--text)]"
            onClick={onClose}
            type="button"
          >
            <XIcon className="h-4 w-4" weight="bold" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-5 py-5">
          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--border)] bg-white/[0.02] px-4 py-3 transition hover:border-white/[0.06] hover:bg-white/[0.03]">
            <input
              checked={onlyGitProjects}
              className="h-4 w-4 accent-[var(--accent)]"
              type="checkbox"
              onChange={(e) => setOnlyGitProjects(e.target.checked)}
            />
            <span className="text-[13px] text-[var(--text)]">
              Solo proyectos con repositorio Git
            </span>
          </label>
          <p className="text-[12px] leading-4 text-[var(--muted)]">
            Cuando est&aacute; activo, solo se muestran skills que pertenecen a un proyecto con
            <code className="ml-1 rounded bg-white/[0.06] px-1 py-0.5 text-[11px]">.git</code>.
          </p>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            className="rounded-[9px] border border-[var(--border)] bg-transparent px-4 py-2 text-[13px] text-[var(--muted)] transition hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-[var(--text)]"
            onClick={handleReset}
            type="button"
          >
            Restablecer
          </button>
          <button
            className="rounded-[9px] border border-transparent bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-white transition hover:brightness-110"
            onClick={handleApply}
            type="button"
          >
            Aplicar
          </button>
        </footer>
      </div>
    </div>
  );
}
