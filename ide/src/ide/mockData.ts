import type { IdeFile } from "./types";

export const initialFiles: IdeFile[] = [
  {
    id: "app",
    path: "src/App.tsx",
    language: "tsx",
    content: `import { useState } from "react";
import { CommandCenter } from "./core/command-center";
import "./theme/tokens.css";

export default function App() {
  const [panel, setPanel] = useState<"files" | "search">("files");

  return (
    <CommandCenter
      panel={panel}
      onTogglePanel={() => setPanel(panel === "files" ? "search" : "files")}
    />
  );
}
`,
    savedContent: `import { useState } from "react";
import { CommandCenter } from "./core/command-center";
import "./theme/tokens.css";

export default function App() {
  const [panel, setPanel] = useState<"files" | "search">("files");

  return (
    <CommandCenter
      panel={panel}
      onTogglePanel={() => setPanel(panel === "files" ? "search" : "files")}
    />
  );
}
`,
  },
  {
    id: "command-center",
    path: "src/core/command-center.ts",
    language: "ts",
    content: `type Command = {
  id: string;
  label: string;
  shortcut: string;
};

export const commands: Command[] = [
  { id: "open-project", label: "Open project", shortcut: "Ctrl+O" },
  { id: "run-app", label: "Run app", shortcut: "Ctrl+R" },
  { id: "toggle-terminal", label: "Toggle terminal", shortcut: "Ctrl+J" },
];

export function filterCommands(query: string) {
  return commands.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase()),
  );
}
`,
    savedContent: `type Command = {
  id: string;
  label: string;
  shortcut: string;
};

export const commands: Command[] = [
  { id: "open-project", label: "Open project", shortcut: "Ctrl+O" },
  { id: "run-app", label: "Run app", shortcut: "Ctrl+R" },
  { id: "toggle-terminal", label: "Toggle terminal", shortcut: "Ctrl+J" },
];

export function filterCommands(query: string) {
  return commands.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase()),
  );
}
`,
  },
  {
    id: "editor",
    path: "src/core/editor.ts",
    language: "ts",
    content: `export type Cursor = {
  line: number;
  column: number;
};

export function getCursor(text: string, offset: number): Cursor {
  const beforeCursor = text.slice(0, offset);
  const lines = beforeCursor.split("\\n");
  const currentLine = lines[lines.length - 1] ?? "";

  return {
    line: lines.length,
    column: currentLine.length,
  };
}
`,
    savedContent: `export type Cursor = {
  line: number;
  column: number;
};

export function getCursor(text: string, offset: number): Cursor {
  const beforeCursor = text.slice(0, offset);
  const lines = beforeCursor.split("\\n");
  const currentLine = lines[lines.length - 1] ?? "";

  return {
    line: lines.length,
    column: currentLine.length,
  };
}
`,
  },
  {
    id: "tokens",
    path: "src/theme/tokens.css",
    language: "css",
    content: `:root {
  --canvas: #09131a;
  --panel: #10222b;
  --panel-strong: #16323c;
  --accent: #ffc857;
  --accent-soft: rgba(255, 200, 87, 0.14);
  --text: #e7f4f1;
  --muted: #8aa6a2;
}
`,
    savedContent: `:root {
  --canvas: #09131a;
  --panel: #10222b;
  --panel-strong: #16323c;
  --accent: #ffc857;
  --accent-soft: rgba(255, 200, 87, 0.14);
  --text: #e7f4f1;
  --muted: #8aa6a2;
}
`,
  },
  {
    id: "package",
    path: "package.json",
    language: "json",
    content: `{
  "name": "forja-ide",
  "private": true,
  "scripts": {
    "dev": "vite",
    "tauri": "tauri"
  }
}
`,
    savedContent: `{
  "name": "forja-ide",
  "private": true,
  "scripts": {
    "dev": "vite",
    "tauri": "tauri"
  }
}
`,
  },
];

export const initialOpenFileIds = ["app", "tokens"];

export const initialTerminalLines = [
  "$ forja dev",
  "booting workspace...",
  "watching src/App.tsx",
  "ready on tauri://localhost",
];

export const blueprintItems = [
  "Explorer + search lateral",
  "Editor with tabs",
  "Console and diagnostics",
  "Tauri shell ready for native features",
];
