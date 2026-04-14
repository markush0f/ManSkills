import { useEffect, useState } from "react";
import type { SystemSkill } from "../../../types";
import { ExpandIcon, FolderNodeIcon, SkillNodeIcon } from "./SidebarTreeIcons";
import type { ProviderSkillGroup } from "./sidebarTreeUtils";

type ProviderSkillListProps = {
  compact: boolean;
  groups: ProviderSkillGroup[];
  onOpenSkill: (skill: SystemSkill) => void;
  searchActive: boolean;
};

export function ProviderSkillList({
  compact,
  groups,
  onOpenSkill,
  searchActive,
}: ProviderSkillListProps) {
  const [expandedProviderIds, setExpandedProviderIds] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.key)),
  );

  useEffect(() => {
    setExpandedProviderIds((current) => {
      const next = new Set(current);
      for (const group of groups) {
        if (!next.has(group.key)) {
          next.add(group.key);
        }
      }
      return next;
    });
  }, [groups]);

  function toggleProvider(providerKey: string) {
    setExpandedProviderIds((current) => {
      const next = new Set(current);
      if (next.has(providerKey)) {
        next.delete(providerKey);
      } else {
        next.add(providerKey);
      }
      return next;
    });
  }

  return (
    <div className="space-y-1.5">
      {groups.map((group) => (
        <div key={group.key} className="space-y-1">
          <button
            className={`flex w-full items-center gap-2 rounded-[12px] border border-transparent text-left text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
              compact ? "px-2 py-1.5 text-[13px]" : "px-2.5 py-2 text-sm"
            }`}
            onClick={() => toggleProvider(group.key)}
            title={group.label}
            type="button"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-[6px] bg-white/[0.02] text-[var(--violet-strong)]">
              <ExpandIcon expanded={searchActive || expandedProviderIds.has(group.key)} />
            </span>
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center text-[var(--accent-strong)]">
              {group.assetPath ? (
                <img
                  alt={`${group.label} provider`}
                  className="h-[18px] w-[18px] object-contain"
                  src={group.assetPath}
                />
              ) : (
                <FolderNodeIcon expanded={searchActive || expandedProviderIds.has(group.key)} name={group.label} root />
              )}
            </span>
            <span className="truncate">{group.label}</span>
            <span className="ml-auto shrink-0 rounded-full border border-[var(--border)] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--text)]">
              {group.folders.reduce((total, folder) => total + folder.skills.length, 0)}
            </span>
          </button>

          {(searchActive || expandedProviderIds.has(group.key)) ? (
            <div className="space-y-1">
              {group.folders
                .flatMap((folder) => folder.skills)
                .sort((left, right) =>
                  left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
                )
                .map((skill) => (
                  <button
                    key={skill.id}
                    className={`flex w-full items-center gap-2 rounded-[11px] border border-transparent text-left text-[var(--text)] transition hover:border-white/[0.04] hover:bg-white/[0.03] ${
                      compact ? "px-2 py-1.5 text-[12px]" : "px-2.5 py-1.5 text-[13px]"
                    }`}
                    onClick={() => onOpenSkill(skill)}
                    style={{ paddingLeft: (compact ? 8 : 12) + (compact ? 12 : 16) }}
                    title={skill.name}
                    type="button"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--accent-strong)]">
                      <SkillNodeIcon />
                    </span>
                    <span className="truncate">{skill.name}</span>
                  </button>
                ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
