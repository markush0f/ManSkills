import { useState } from "react";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import type { SystemSkillTreeNode } from "../../ide/types";
import { CheckboxInput, NumberInput, SelectInput, TextInput } from "../shared/formControls";
import { shellPanelClass } from "../shared/ui";

type SettingsCategory = "text" | "cursor" | "display" | "workspace";

const SETTINGS_CATEGORIES: Array<{ id: SettingsCategory; label: string }> = [
  { id: "text", label: "Text Editor" },
  { id: "cursor", label: "Cursor" },
  { id: "display", label: "Display" },
  { id: "workspace", label: "Workspace" },
];

function countSkills(nodes: SystemSkillTreeNode[]): number {
  return nodes.reduce((total, node) => {
    const current = node.kind === "skill" ? 1 : 0;
    return total + current + countSkills(node.children);
  }, 0);
}

function matchesSearch(query: string, ...values: string[]) {
  if (query.length === 0) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function CategoryButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-2 border-l px-3 py-2.5 text-left text-[12px] transition ${
        active
          ? "border-[var(--accent)] bg-[linear-gradient(90deg,rgba(217,98,59,0.14),rgba(255,255,255,0.02))] text-[var(--text)]"
          : "border-transparent text-[var(--muted)] hover:bg-white/[0.02] hover:text-[var(--text)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[var(--accent)]" : "bg-white/20"
        }`}
      />
      {label}
    </button>
  );
}

function Section({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white/[0.015]">
      <div>{children}</div>
    </section>
  );
}

function SettingRow({
  children,
  description,
  isFirst = false,
  label,
}: {
  children: React.ReactNode;
  description: string;
  isFirst?: boolean;
  label: string;
}) {
  return (
    <div className={`${isFirst ? "" : "border-t border-t-[var(--border)] "}border-l-2 border-l-transparent px-4 py-3 transition hover:bg-white/[0.015] focus-within:border-l-[#2aa9ff] focus-within:bg-white/[0.03]`}>
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--text)]">{label}</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{description}</p>
      </div>
      <div className="mt-3 flex min-w-0 items-center">{children}</div>
    </div>
  );
}

function CheckboxSetting({
  checked,
  description,
  isFirst,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  isFirst?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingRow description={description} isFirst={isFirst} label={label}>
      <label className="inline-flex items-center gap-2 text-[12px] text-[var(--text)]">
        <CheckboxInput
          checked={checked}
          onChange={onChange}
        />
        <span>{checked ? "Enabled" : "Disabled"}</span>
      </label>
    </SettingRow>
  );
}

function SelectSetting<T extends string>({
  description,
  isFirst,
  label,
  onChange,
  options,
  value,
}: {
  description: string;
  isFirst?: boolean;
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <SettingRow description={description} isFirst={isFirst} label={label}>
      <SelectInput
        className="max-w-[180px]"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    </SettingRow>
  );
}

function NumberSetting({
  description,
  isFirst,
  label,
  max,
  min,
  onChange,
  value,
}: {
  description: string;
  isFirst?: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <SettingRow description={description} isFirst={isFirst} label={label}>
      <NumberInput
        className="max-w-[92px]"
        max={max}
        min={min}
        onValueChange={onChange}
        value={value}
      />
    </SettingRow>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-l-2 border-t-[var(--border)] border-l-transparent px-4 py-3">
      <p className="text-[13px] text-[var(--text)]">{label}</p>
      <p className="mt-2 truncate text-[12px] text-[var(--muted)]">{value}</p>
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
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>("text");
  const [query, setQuery] = useState("");
  const systemSkillCount = countSkills(systemSkillTree);

  const showCategory = (category: SettingsCategory) => selectedCategory === category;

  const showTextSection =
    showCategory("text") &&
    (matchesSearch(query, "Editor: Font Size", "Tamano base del codigo dentro de Monaco.") ||
      matchesSearch(query, "Editor: Line Height", "Altura entre lineas del editor.") ||
      matchesSearch(query, "Editor: Tab Size", "Ancho de tabulacion aplicado por Monaco.") ||
      matchesSearch(query, "Editor: Font Ligatures", "Activa ligaduras tipograficas en Cascadia Code."));

  const showCursorSection =
    showCategory("cursor") &&
    (matchesSearch(query, "Editor: Smooth Caret Animation", "Suaviza el movimiento del cursor.") ||
      matchesSearch(query, "Editor: Cursor Style", "Forma principal del cursor.") ||
      matchesSearch(query, "Editor: Smooth Scrolling", "Desplazamiento suave del viewport.") ||
      matchesSearch(query, "Editor: Scroll Beyond Last Line", "Aire despues de la ultima linea."));

  const showDisplaySection =
    showCategory("display") &&
    (matchesSearch(query, "Editor: Minimap", "Activa el minimap lateral.") ||
      matchesSearch(query, "Editor: Render Line Highlight", "Resalta la linea actual.") ||
      matchesSearch(query, "Editor: Bracket Pair Guides", "Guias de brackets.") ||
      matchesSearch(query, "Editor: Line Numbers", "Pintado de numeros de linea.") ||
      matchesSearch(query, "Editor: Render Whitespace", "Visibilidad de tabs y espacios.") ||
      matchesSearch(query, "Editor: Word Wrap Markdown", "Ajuste automatico de markdown."));

  const showWorkspaceSection =
    showCategory("workspace") &&
    (matchesSearch(query, "Workbench: Sidebar Width", "Ancho actual del panel lateral.") ||
      matchesSearch(query, "Workspace: Active File", activeFile.path) ||
      matchesSearch(query, "Workspace: Open Tabs", String(openFiles.length)) ||
      matchesSearch(query, "Workspace: Loaded Skills", String(systemSkillCount)) ||
      matchesSearch(query, "Workspace: Last Scan", systemSkillScanMs === null ? "Sin datos" : `${systemSkillScanMs} ms`));

  const hasResults =
    showTextSection || showCursorSection || showDisplaySection || showWorkspaceSection;

  return (
    <section
      className={`${shellPanelClass} min-h-0 min-w-0 overflow-hidden`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <div className="grid h-full min-h-0 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border)] bg-white/[0.015] xl:border-b-0 xl:border-r">
          <div className="border-b border-[var(--border)] px-3 py-3">
            <div className="relative">
              <TextInput
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search settings"
                value={query}
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--muted)]">
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.25 11.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5ZM10.5 10.5 13 13"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.3"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="py-2">
            {SETTINGS_CATEGORIES.map((category) => (
              <CategoryButton
                key={category.id}
                active={selectedCategory === category.id}
                label={category.label}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </aside>

        <div className="min-h-0 overflow-auto">
          <div className="px-4 py-4">
            <div className="rounded-[14px] border border-[var(--border)] bg-white/[0.015]">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h1 className="text-[14px] text-[var(--text)]">
                  {SETTINGS_CATEGORIES.find((category) => category.id === selectedCategory)?.label}
                </h1>
                {query.trim().length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--muted)]">Filtered by: {query.trim()}</p>
                )}
              </div>

              {showTextSection && (
                <Section>
                  {matchesSearch(query, "Editor: Font Size", "Tamano base del codigo dentro de Monaco.") && (
                    <NumberSetting
                      description="Tamano base del codigo dentro de Monaco."
                      isFirst
                      label="Editor: Font Size"
                      max={20}
                      min={12}
                      onChange={(value) => updatePreferences({ fontSize: value })}
                      value={preferences.fontSize}
                    />
                  )}
                  {matchesSearch(query, "Editor: Line Height", "Altura entre lineas del editor.") && (
                    <NumberSetting
                      description="Altura entre lineas para un editor mas compacto o mas respirado."
                      label="Editor: Line Height"
                      max={36}
                      min={20}
                      onChange={(value) => updatePreferences({ lineHeight: value })}
                      value={preferences.lineHeight}
                    />
                  )}
                  {matchesSearch(query, "Editor: Tab Size", "Ancho de tabulacion aplicado por Monaco.") && (
                    <NumberSetting
                      description="Ancho de tabulacion aplicado por Monaco."
                      label="Editor: Tab Size"
                      max={8}
                      min={2}
                      onChange={(value) => updatePreferences({ tabSize: value })}
                      value={preferences.tabSize}
                    />
                  )}
                  {matchesSearch(query, "Editor: Font Ligatures", "Activa ligaduras tipograficas en Cascadia Code.") && (
                    <CheckboxSetting
                      checked={preferences.fontLigatures}
                      description="Activa ligaduras tipograficas cuando la fuente las soporta."
                      label="Editor: Font Ligatures"
                      onChange={(value) => updatePreferences({ fontLigatures: value })}
                    />
                  )}
                </Section>
              )}

              {showCursorSection && (
                <Section>
                  {matchesSearch(query, "Editor: Smooth Caret Animation", "Suaviza el movimiento del cursor.") && (
                    <CheckboxSetting
                      checked={preferences.cursorAnimation}
                      description="Suaviza el movimiento del cursor mientras escribes."
                      isFirst
                      label="Editor: Smooth Caret Animation"
                      onChange={(value) => updatePreferences({ cursorAnimation: value })}
                    />
                  )}
                  {matchesSearch(query, "Editor: Cursor Style", "Forma principal del cursor.") && (
                    <SelectSetting
                      description="Forma principal del cursor en el editor."
                      label="Editor: Cursor Style"
                      onChange={(value) => updatePreferences({ cursorStyle: value })}
                      options={[
                        { label: "Line Thin", value: "line-thin" },
                        { label: "Line", value: "line" },
                        { label: "Block", value: "block" },
                        { label: "Underline", value: "underline" },
                      ]}
                      value={preferences.cursorStyle}
                    />
                  )}
                  {matchesSearch(query, "Editor: Smooth Scrolling", "Desplazamiento suave del viewport.") && (
                    <CheckboxSetting
                      checked={preferences.smoothScrolling}
                      description="Hace mas suave el desplazamiento del viewport y de los trackpads."
                      label="Editor: Smooth Scrolling"
                      onChange={(value) => updatePreferences({ smoothScrolling: value })}
                    />
                  )}
                  {matchesSearch(query, "Editor: Scroll Beyond Last Line", "Aire despues de la ultima linea.") && (
                    <CheckboxSetting
                      checked={preferences.scrollBeyondLastLine}
                      description="Deja aire despues de la ultima linea para una sensacion mas suelta."
                      label="Editor: Scroll Beyond Last Line"
                      onChange={(value) => updatePreferences({ scrollBeyondLastLine: value })}
                    />
                  )}
                </Section>
              )}

              {showDisplaySection && (
                <Section>
                  {matchesSearch(query, "Editor: Minimap", "Activa el minimap lateral.") && (
                    <CheckboxSetting
                      checked={preferences.minimap}
                      description="Activa el minimap lateral de Monaco."
                      isFirst
                      label="Editor: Minimap"
                      onChange={(value) => updatePreferences({ minimap: value })}
                    />
                  )}
                  {matchesSearch(query, "Editor: Render Line Highlight", "Resalta la linea actual.") && (
                    <CheckboxSetting
                      checked={preferences.highlightActiveLine}
                      description="Resalta la linea actual para orientar mejor la vista."
                      label="Editor: Render Line Highlight"
                      onChange={(value) => updatePreferences({ highlightActiveLine: value })}
                    />
                  )}
                  {matchesSearch(query, "Editor: Bracket Pair Guides", "Guias de brackets.") && (
                    <CheckboxSetting
                      checked={preferences.bracketPairGuides}
                      description="Muestra guias de anidacion y pares de brackets."
                      label="Editor: Bracket Pair Guides"
                      onChange={(value) => updatePreferences({ bracketPairGuides: value })}
                    />
                  )}
                  {matchesSearch(query, "Editor: Line Numbers", "Pintado de numeros de linea.") && (
                    <SelectSetting
                      description="Controla como se pintan los numeros de linea."
                      label="Editor: Line Numbers"
                      onChange={(value) => updatePreferences({ lineNumbers: value })}
                      options={[
                        { label: "On", value: "on" },
                        { label: "Relative", value: "relative" },
                        { label: "Off", value: "off" },
                      ]}
                      value={preferences.lineNumbers}
                    />
                  )}
                  {matchesSearch(query, "Editor: Render Whitespace", "Visibilidad de tabs y espacios.") && (
                    <SelectSetting
                      description="Nivel de visibilidad de espacios y tabs en el texto."
                      label="Editor: Render Whitespace"
                      onChange={(value) => updatePreferences({ renderWhitespace: value })}
                      options={[
                        { label: "None", value: "none" },
                        { label: "Selection", value: "selection" },
                        { label: "Boundary", value: "boundary" },
                        { label: "All", value: "all" },
                      ]}
                      value={preferences.renderWhitespace}
                    />
                  )}
                  {matchesSearch(query, "Editor: Word Wrap Markdown", "Ajuste automatico de markdown.") && (
                    <CheckboxSetting
                      checked={preferences.markdownWordWrap}
                      description="Ajusta automaticamente markdown sin afectar otros archivos."
                      label="Editor: Word Wrap Markdown"
                      onChange={(value) => updatePreferences({ markdownWordWrap: value })}
                    />
                  )}
                </Section>
              )}

              {showWorkspaceSection && (
                <Section>
                  {matchesSearch(query, "Workbench: Sidebar Width", "Ancho actual del panel lateral.") && (
                    <div className="grid gap-3 border-t border-[var(--border)] px-4 py-3 xl:grid-cols-[minmax(0,1fr)_180px] xl:items-start">
                      <div className="min-w-0">
                        <p className="text-[13px] text-[var(--text)]">Workbench: Sidebar Width</p>
                        <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                          Ancho actual del panel lateral. Puedes restaurarlo al valor por defecto.
                        </p>
                      </div>
                      <div className="flex items-center justify-start gap-2 xl:justify-end">
                        <span className="text-[12px] text-[var(--muted)]">{sidebarWidth}px</span>
                        <button
                          className="border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
                          onClick={resetSidebarWidth}
                          type="button"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                  {matchesSearch(query, "Workspace: Active File", activeFile.path) && (
                    <InfoRow label="Workspace: Active File" value={activeFile.path} />
                  )}
                  {matchesSearch(query, "Workspace: Open Tabs", String(openFiles.length)) && (
                    <InfoRow label="Workspace: Open Tabs" value={String(openFiles.length)} />
                  )}
                  {matchesSearch(query, "Workspace: Loaded Skills", String(systemSkillCount)) && (
                    <InfoRow label="Workspace: Loaded Skills" value={String(systemSkillCount)} />
                  )}
                  {matchesSearch(query, "Workspace: Last Scan", systemSkillScanMs === null ? "Sin datos" : `${systemSkillScanMs} ms`) && (
                    <InfoRow
                      label="Workspace: Last Scan"
                      value={systemSkillScanMs === null ? "Sin datos" : `${systemSkillScanMs} ms`}
                    />
                  )}
                </Section>
              )}

              {!hasResults && (
                <div className="px-4 py-6 text-[12px] text-[var(--muted)]">
                  No settings match the current search.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
