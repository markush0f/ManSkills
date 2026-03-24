import type { IdePreferences } from "../types";
import { matchesSearch } from "./settingsUtils";
import type { UpdatePreferences } from "./settingsTypes";
import { CheckboxSetting, NumberSetting, Section } from "./SettingsRows";

type TextEditorSettingsSectionProps = {
  preferences: IdePreferences;
  query: string;
  updatePreferences: UpdatePreferences;
};

export function hasTextEditorSettingsResults(query: string) {
  return (
    matchesSearch(query, "Editor: Font Size", "Tamano base del codigo dentro de Monaco.") ||
    matchesSearch(query, "Editor: Line Height", "Altura entre lineas del editor.") ||
    matchesSearch(query, "Editor: Tab Size", "Ancho de tabulacion aplicado por Monaco.") ||
    matchesSearch(query, "Editor: Font Ligatures", "Activa ligaduras tipograficas en Cascadia Code.")
  );
}

export function TextEditorSettingsSection({
  preferences,
  query,
  updatePreferences,
}: TextEditorSettingsSectionProps) {
  if (!hasTextEditorSettingsResults(query)) {
    return null;
  }

  return (
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
  );
}
