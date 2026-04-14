import { type ReactNode } from "react";

import { SidebarFooter } from "./sidebar/SidebarFooter";
import { LocalTreeList } from "./sidebar/LocalTreeList";
import { ProviderSkillList } from "./sidebar/ProviderSkillList";
import { SidebarSearch } from "./sidebar/SidebarSearch";
import { ExpandIcon } from "./sidebar/SidebarTreeIcons";
import { SystemSkillTreeList } from "./sidebar/SystemSkillTreeList";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { useSidebarState } from "../../contexts/SidebarContext";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/SkeletonBlock";
import { ghostButtonClass } from "../shared/ui";
import { shellPanelClass } from "../shared/ui";

function SidebarSection({
  action,
  children,
  expanded,
  onToggle,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          className="flex min-w-0 items-center gap-1.5 rounded-[8px] px-1 py-1 text-left text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:bg-white/[0.03] hover:text-[var(--text)]"
          onClick={onToggle}
          type="button"
        >
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center text-[var(--violet-strong)]">
            <ExpandIcon expanded={expanded} />
          </span>
          <span className="truncate">{title}</span>
        </button>
        {action}
      </div>
      {expanded ? <div className="space-y-1.5">{children}</div> : null}
    </section>
  );
}

export function Sidebar() {
  const {
    activeFileId,
    clearSystemSkillActionError,
    listSystemSkillFiles,
    listingSystemSkillIds,
    openFile,
    openingSystemSkillIds,
    openSystemSkill,
    openSystemSkillFile,
    refreshSystemSkillTree,
    systemSkillActionError,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
  } = useIde();
  const { isSidebarCompact: compact } = useIdeLayout();
  const {
    expandedSystemSkillNodeIds,
    fileById,
    hasFilteredProviderSkills,
    filteredSystemSkillTree,
    filteredTree,
    hasFilteredSystemSkills,
    hasFilteredWorkspaceFiles,
    hasWorkspaceFiles,
    providerSkillGroups,
    providersExpanded,
    searchActive,
    setQuery,
    systemSkillsExpanded,
    toggleSection,
    toggleSystemSkillNode,
    workspaceExpanded,
  } = useSidebarState();

  return (
    <aside
      className={`${shellPanelClass} relative flex h-full min-h-0 flex-col overflow-hidden bg-[image:var(--sidebar-bg)] text-[13px]`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <div className="relative z-[1] grid h-[var(--app-header-height)] grid-cols-[minmax(0,1fr)_72px] items-center gap-1.5 border-b border-[var(--border)] bg-[image:var(--topbar-bg)] px-2 shadow-[var(--topbar-shadow)]">
        <div className="min-w-0">
          <SidebarSearch />
        </div>
        <div className="w-[72px] shrink-0">
          <SidebarFooter placement="header" />
        </div>
      </div>

      <div
        className={`relative z-[1] flex-1 overflow-auto border-r border-[var(--border)] bg-[var(--sidebar-surface)] ${compact ? "px-2 pb-2 pt-0" : "px-2 pb-2 pt-0"}`}
      >
        <div className="space-y-3 px-2.5 pb-3 pt-3">
          <SidebarSection
            expanded={workspaceExpanded}
            onToggle={() => toggleSection("workspace")}
            title="Workspace"
          >
            {hasFilteredWorkspaceFiles ? (
              <LocalTreeList
                activeFileId={activeFileId}
                compact={compact}
                fileById={fileById}
                nodes={filteredTree}
                onOpenFile={openFile}
              />
            ) : (
              <EmptyState
                eyebrow="Workspace"
                message={
                  searchActive
                    ? "No open buffers match the current search."
                    : hasWorkspaceFiles
                      ? "No open buffers are visible with the current filter."
                      : "Open a system skill to load its files into the workspace."
                }
                title={searchActive ? "No matching buffers" : "No open files"}
              />
            )}
          </SidebarSection>

          <SidebarSection
            action={
              systemSkillsError ? (
                <button
                  className="rounded-[9px] border border-[var(--border)] bg-white/[0.02] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                  onClick={() => void refreshSystemSkillTree()}
                  type="button"
                >
                  Retry
                </button>
              ) : undefined
            }
            expanded={systemSkillsExpanded}
            onToggle={() => toggleSection("systemSkills")}
            title="System Skills"
          >
            {systemSkillsLoading ? (
              <div className="space-y-3 rounded-[12px] border border-dashed border-[var(--border)] bg-black/10 px-3 py-3">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-[88%]" />
              </div>
            ) : systemSkillsError ? (
              <div className="space-y-3 rounded-[12px] border border-dashed border-[#cf5e4f]/25 bg-[#cf5e4f]/10 px-3 py-3">
                <p className="text-xs leading-5 text-[#ffb3a7]">{systemSkillsError}</p>
                <button
                  className={ghostButtonClass}
                  onClick={() => void refreshSystemSkillTree()}
                  type="button"
                >
                  Retry scan
                </button>
              </div>
            ) : hasFilteredSystemSkills ? (
              <SystemSkillTreeList
                activeFileId={activeFileId}
                compact={compact}
                expandedNodeIds={expandedSystemSkillNodeIds}
                nodes={filteredSystemSkillTree}
                onListSkillFiles={listSystemSkillFiles}
                onOpenSkill={openSystemSkill}
                onOpenSkillFile={openSystemSkillFile}
                openingSystemSkillIds={openingSystemSkillIds}
                searchActive={searchActive}
                listingSystemSkillIds={listingSystemSkillIds}
                onToggleNode={toggleSystemSkillNode}
              />
            ) : (
              <EmptyState
                action={
                  searchActive ? (
                    <button className={ghostButtonClass} onClick={() => setQuery("")} type="button">
                      Clear search
                    </button>
                  ) : undefined
                }
                eyebrow="System Skills"
                message={
                  searchActive
                    ? "No system skills match the current search."
                    : "No skills with a `SKILL.md` manifest were found."
                }
                title={searchActive ? "No search results" : "No system skills found"}
              />
            )}

            {systemSkillActionError && (
              <div className="flex items-start justify-between gap-2 rounded-[12px] border border-[#cf5e4f]/25 bg-[#cf5e4f]/10 px-3 py-2 text-xs text-[#ffb3a7]">
                <span className="leading-5">{systemSkillActionError}</span>
                <button
                  className="shrink-0 rounded-[8px] border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#ffd5cd] transition hover:bg-white/5"
                  onClick={clearSystemSkillActionError}
                  type="button"
                >
                  Clear
                </button>
              </div>
            )}
          </SidebarSection>

          <SidebarSection
            expanded={providersExpanded}
            onToggle={() => toggleSection("providers")}
            title="Providers"
          >
            {systemSkillsLoading ? (
              <div className="space-y-3 rounded-[12px] border border-dashed border-[var(--border)] bg-black/10 px-3 py-3">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-3 w-full" />
              </div>
            ) : hasFilteredProviderSkills ? (
              <ProviderSkillList
                compact={compact}
                groups={providerSkillGroups}
                onOpenSkill={openSystemSkill}
                searchActive={searchActive}
              />
            ) : (
              <EmptyState
                action={
                  searchActive ? (
                    <button className={ghostButtonClass} onClick={() => setQuery("")} type="button">
                      Clear search
                    </button>
                  ) : undefined
                }
                eyebrow="Providers"
                message={
                  searchActive
                    ? "No providers match the current search."
                    : systemSkills.length > 0
                      ? "No providers could be inferred from the detected skill paths."
                      : "No system skills are available yet."
                }
                title={searchActive ? "No provider matches" : "No providers found"}
              />
            )}
          </SidebarSection>
        </div>
      </div>

    </aside>
  );
}
