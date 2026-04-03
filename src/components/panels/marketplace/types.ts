import type { MarketplaceInstallTarget } from "../../../types";

export const INSTALL_TARGET_OPTIONS: Array<{ label: string; value: MarketplaceInstallTarget }> = [
  { label: "Codex", value: "codex" },
  { label: "Claude", value: "claude" },
  { label: "Workspace", value: "workspace" },
];

export const MARKETPLACE_TABLE_COLUMNS =
  "lg:grid-cols-[minmax(280px,0.95fr)_minmax(420px,1.5fr)_170px_120px_240px]";

export type MarketplaceSkillState =
  | "not_installed"
  | "installed"
  | "update_available"
  | "installing"
  | "updating"
  | "uninstalling";
