import type { MarketplaceInstallTarget } from "./marketplace-install-result";
import type { SaveShortcut } from "./save-shortcut";

export type IdePreferences = {
  bracketPairGuides: boolean;
  cursorAnimation: boolean;
  cursorStyle: "line-thin" | "line" | "block" | "underline";
  fontLigatures: boolean;
  fontSize: number;
  highlightActiveLine: boolean;
  lineHeight: number;
  lineNumbers: "on" | "off" | "relative";
  marketplaceInstallCollection: string;
  marketplaceInstallTarget: MarketplaceInstallTarget;
  markdownWordWrap: boolean;
  minimap: boolean;
  renderWhitespace: "none" | "boundary" | "selection" | "all";
  saveShortcut: SaveShortcut;
  scrollBeyondLastLine: boolean;
  smoothScrolling: boolean;
  tabSize: number;
};
