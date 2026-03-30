import type { IdePreferences } from "../types";
import { matchesSearch } from "./settingsUtils";
import type { UpdatePreferences } from "./settingsTypes";
import { CheckboxSetting, Section, SelectSetting } from "./SettingsRows";

type CursorSettingsSectionProps = {
  preferences: IdePreferences;
  query: string;
  updatePreferences: UpdatePreferences;
};

export function hasCursorSettingsResults(query: string) {
  return (
    matchesSearch(query, "Editor: Smooth Caret Animation", "Suaviza el movimiento del cursor.") ||
    matchesSearch(query, "Editor: Cursor Style", "Forma principal del cursor.") ||
    matchesSearch(query, "Editor: Smooth Scrolling", "Desplazamiento suave del viewport.") ||
    matchesSearch(query, "Editor: Scroll Beyond Last Line", "Aire despues de la ultima linea.")
  );
}

export function CursorSettingsSection({
  preferences,
  query,
  updatePreferences,
}: CursorSettingsSectionProps) {
  if (!hasCursorSettingsResults(query)) {
    return null;
  }

  return (
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
  );
}
