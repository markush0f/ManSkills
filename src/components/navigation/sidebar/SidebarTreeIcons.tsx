import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import type { IdeFile, SystemSkillTreeNode } from "../../../types";
import { findProviderAsset } from "../../../constants/provider-assets";

addCollection(codiconIcons);

function DefaultFolderIcon({
  expanded,
  root,
}: {
  expanded: boolean;
  root: boolean;
}) {
  return (
    <Icon
      icon={
        root
          ? expanded
            ? "codicon:root-folder-opened"
            : "codicon:root-folder"
          : expanded
            ? "codicon:folder-opened"
            : "codicon:folder"
      }
      className="h-4 w-4"
    />
  );
}

function ProviderFolderImage({
  fallback,
  assetPath,
  alt,
}: {
  fallback: ReactNode;
  assetPath: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [assetPath]);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      alt={alt}
      className="h-4 w-4 object-contain"
      onError={() => setFailed(true)}
      src={assetPath}
    />
  );
}

export function ExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <Icon
      icon={expanded ? "codicon:chevron-down" : "codicon:chevron-right"}
      className="h-3.5 w-3.5"
    />
  );
}

export function FolderNodeIcon({
  expanded,
  name,
  path,
  root = false,
}: {
  expanded: boolean;
  name?: string;
  path?: string;
  root?: boolean;
}) {
  const provider = useMemo(() => findProviderAsset(name, path), [name, path]);

  if (provider) {
    return (
      <ProviderFolderImage
        alt={`${provider.label} provider`}
        assetPath={provider.assetPath}
        fallback={<DefaultFolderIcon expanded={expanded} root={root} />}
      />
    );
  }

  return <DefaultFolderIcon expanded={expanded} root={root} />;
}

export function SkillNodeIcon() {
  return <Icon icon="codicon:folder-library" className="h-4 w-4" />;
}

export function FileNodeIcon({
  language,
}: {
  language?: IdeFile["language"] | NonNullable<SystemSkillTreeNode["file"]>["language"];
}) {
  let icon = "codicon:file";

  if (language === "md") {
    icon = "codicon:markdown";
  } else if (language === "json") {
    icon = "codicon:json";
  } else if (language === "txt") {
    icon = "codicon:file-text";
  } else if (language === "ts") {
    icon = "codicon:file-code";
  }

  return <Icon icon={icon} className="h-4 w-4" />;
}
