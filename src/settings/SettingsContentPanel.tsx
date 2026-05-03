import { CursorSettingsSection } from "./CursorSettingsSection";
import { DisplaySettingsSection } from "./DisplaySettingsSection";
import { SkillsSettingsSection } from "./SkillsSettingsSection";
import { useSettings } from "./SettingsContext";
import { TextEditorSettingsSection } from "./TextEditorSettingsSection";
import { WorkspaceSettingsSection } from "./WorkspaceSettingsSection";

export function SettingsContentPanel() {
  const { hasResults, query, selectedCategory, selectedCategoryLabel } = useSettings();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[image:var(--settings-content-bg)]">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="box-border flex min-h-full flex-col p-4">
          <div className="flex min-h-full flex-1 flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[image:var(--settings-frame-bg)] shadow-[var(--settings-frame-shadow)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--settings-title-dot)] shadow-[0_0_14px_var(--settings-title-glow)]" />
                <h1 className="text-[14px] font-medium tracking-[0.01em] text-[var(--text)]">
                  {selectedCategoryLabel}
                </h1>
              </div>
              {query.trim().length > 0 && (
                <p className="mt-1 inline-flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
                  Filtrado por: {query.trim()}
                </p>
              )}
            </div>

            {hasResults ? (
              <>
                {selectedCategory === "text" && <TextEditorSettingsSection />}
                {selectedCategory === "cursor" && <CursorSettingsSection />}
                {selectedCategory === "display" && <DisplaySettingsSection />}
                {selectedCategory === "skills" && <SkillsSettingsSection />}
                {selectedCategory === "workspace" && <WorkspaceSettingsSection />}
              </>
            ) : (
              <div className="px-5 py-6 text-[12px] text-[var(--muted)]">
                No hay ajustes para la busqueda actual.
              </div>
            )}

            <div className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
