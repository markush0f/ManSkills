import type { MarketplaceInstallTarget } from "../../../types";

export const INSTALL_TARGET_OPTIONS: Array<{ label: string; value: MarketplaceInstallTarget }> = [
  { label: "Codex", value: "codex" },
  { label: "Claude", value: "claude" },
  { label: "Workspace", value: "workspace" },
];

export type MarketplaceSkillState =
  | "not_installed"
  | "installed"
  | "update_available"
  | "installing"
  | "updating"
  | "uninstalling";
