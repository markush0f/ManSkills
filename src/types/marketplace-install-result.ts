export type MarketplaceInstallTarget = "codex" | "claude" | "workspace";

export type MarketplaceInstallResult = {
  skillId: string;
  slug: string;
  target: MarketplaceInstallTarget | string;
  installedPath: string;
  fileCount: number;
};
