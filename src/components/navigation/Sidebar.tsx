import { useDeferredValue, useMemo, useState, type ReactNode } from "react";

import { SidebarFooter } from "./sidebar/SidebarFooter";
import { LocalTreeList } from "./sidebar/LocalTreeList";
import { SidebarSearch } from "./sidebar/SidebarSearch";
import { filterSystemSkillTreeNodes, filterTreeNodes } from "./sidebar/sidebarTreeUtils";
import { ExpandIcon } from "./sidebar/SidebarTreeIcons";
import { SystemSkillTreeList } from "./sidebar/SystemSkillTreeList";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
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
    files,
    isMarketplaceView,
    isSettingsView,
    listSystemSkillFiles,
    listingSystemSkillIds,
    openFile,
    openMarketplace,
    openSettings,
    openingSystemSkillIds,
    openSystemSkill,
    openSystemSkillFile,
    refreshSystemSkillTree,
    systemSkillActionError,
    systemSkillsError,
    systemSkillsLoading,
    systemSkillTree,
    tree,
  } = useIde();
  const { isSidebarCompact: compact } = useIdeLayout();
  const [expandedSystemSkillNodeIds, setExpandedSystemSkillNodeIds] = useState<Set<string>>(() => new Set());
  const [expandedSections, setExpandedSections] = useState(() => ({
    systemSkills: true,
    workspace: true,
  }));
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file] as const)), [files]);
  const filteredSystemSkillTree = useMemo(
    () => filterSystemSkillTreeNodes(systemSkillTree, deferredQuery),
    [deferredQuery, systemSkillTree],
  );
  const filteredTree = useMemo(
    () => filterTreeNodes(tree, fileById, deferredQuery),
    [deferredQuery, fileById, tree],
  );
  const searchActive = deferredQuery.trim().length > 0;
  const hasWorkspaceFiles = files.length > 0;
  const hasFilteredSystemSkills = filteredSystemSkillTree.length > 0;
  const hasFilteredWorkspaceFiles = filteredTree.length > 0;
  const workspaceExpanded = searchActive || expandedSections.workspace;
  const systemSkillsExpanded = searchActive || expandedSections.systemSkills;

  function toggleSystemSkillNode(nodeId: string) {
    setExpandedSystemSkillNodeIds((current) => {
      const next = new Set(current);

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  return (
    <aside
      className={`${shellPanelClass} relative flex h-full min-h-0 flex-col overflow-hidden bg-[image:var(--sidebar-bg)] text-[13px]`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <div className="relative z-[1] grid h-[var(--app-header-height)] grid-cols-[minmax(0,1fr)_72px] items-center gap-1.5 border-b border-[var(--border)] bg-[image:var(--topbar-bg)] px-2 shadow-[var(--topbar-shadow)]">
        <div className="min-w-0">
          <SidebarSearch query={query} setQuery={setQuery} />
        </div>
        <div className="w-[72px] shrink-0">
          <SidebarFooter
            isMarketplaceView={isMarketplaceView}
            isSettingsView={isSettingsView}
            openMarketplace={openMarketplace}
            openSettings={openSettings}
            placement="header"
          />
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
              <p className="rounded-[12px] border border-dashed border-[var(--border)] bg-black/10 px-3 py-2.5 text-xs leading-5 text-[var(--muted)]">
                {searchActive
                  ? "No hay buffers abiertos que coincidan con la busqueda."
                  : hasWorkspaceFiles
                    ? "No hay buffers visibles con el filtro actual."
                    : "Todavia no has abierto ningun archivo. Usa la seccion de system skills para empezar."}
              </p>
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
              <p className="rounded-[12px] border border-dashed border-[var(--border)] bg-black/10 px-3 py-2.5 text-xs leading-5 text-[var(--muted)]">
                Escaneando skills del sistema...
              </p>
            ) : systemSkillsError ? (
              <p className="rounded-[12px] border border-dashed border-[#cf5e4f]/25 bg-[#cf5e4f]/10 px-3 py-2.5 text-xs leading-5 text-[#ffb3a7]">
                {systemSkillsError}
              </p>
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
              <p className="rounded-[12px] border border-dashed border-[var(--border)] bg-black/10 px-3 py-2.5 text-xs leading-5 text-[var(--muted)]">
                {searchActive
                  ? "No hay resultados para esa busqueda."
                  : "No se encontraron skills con manifiesto `SKILL.md`."}
              </p>
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
        </div>
      </div>

    </aside>
  );
}
