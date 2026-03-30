export type MarketplaceInstallMetadata = {
  skillId: string | null;
  slug: string;
  name: string;
  githubUrl: string | null;
  skillUrl: string | null;
  remoteUpdatedAt: string | null;
  installTarget: string | null;
  installCollection: string | null;
  installedAt: string;
  installedPath: string;
  installer: string;
};
