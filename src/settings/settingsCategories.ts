export type SettingsCategory = "text" | "cursor" | "display" | "workspace";

export const SETTINGS_CATEGORIES: Array<{ id: SettingsCategory; label: string }> = [
  { id: "text", label: "Text Editor" },
  { id: "cursor", label: "Cursor" },
  { id: "display", label: "Display" },
  { id: "workspace", label: "Workspace" },
];
