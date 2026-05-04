import type { IdePreferences } from "../types";
import { matchesSearch } from "./settingsUtils";
import type { UpdatePreferences } from "./settingsTypes";
import { CheckboxSetting, Section, SelectSetting } from "./SettingsRows";

type DisplaySettingsSectionProps = {
  preferences: IdePreferences;
  query: string;
  updatePreferences: UpdatePreferences;
};

export function hasDisplaySettingsResults(query: string) {
  return (
    matchesSearch(query, "Editor: Minimap", "Activa el minimap lateral.") ||
    matchesSearch(query, "Editor: Render Line Highlight", "Resalta la linea actual.") ||
    matchesSearch(query, "Editor: Bracket Pair Guides", "Guias de brackets.") ||
    matchesSearch(query, "Editor: Line Numbers", "Pintado de numeros de linea.") ||
    matchesSearch(query, "Editor: Render Whitespace", "Visibilidad de tabs y espacios.") ||
    matchesSearch(query, "Editor: Word Wrap Markdown", "Ajuste automatico de markdown.")
  );
}

export function DisplaySettingsSection({
  preferences,
  query,
  updatePreferences,
}: DisplaySettingsSectionProps) {
  if (!hasDisplaySettingsResults(query)) {
    return null;
  }

  return (
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
  );
}
