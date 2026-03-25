import { useDeferredValue, useMemo, useState } from "react";

import { SidebarFooter } from "./sidebar/SidebarFooter";
import { LocalTreeList } from "./sidebar/LocalTreeList";
import { SidebarSearch } from "./sidebar/SidebarSearch";
import { filterSystemSkillTreeNodes, filterTreeNodes } from "./sidebar/sidebarTreeUtils";
import { SystemSkillTreeList } from "./sidebar/SystemSkillTreeList";
import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { shellPanelClass } from "../shared/ui";

export function Sidebar() {
  const {
    activeFileId,
    files,
    isMarketplaceView,
    isSettingsView,
    openFile,
    openMarketplace,
    openSettings,
    openSystemSkill,
    openSystemSkillFile,
    openingSystemSkillId,
    systemSkillsError,
    systemSkillsLoading,
    systemSkillTree,
    tree,
  } = useIde();
  const { isSidebarCompact: compact } = useIdeLayout();
  const [expandedSystemSkillNodeIds, setExpandedSystemSkillNodeIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file] as const)), [files]);
  const hasSystemSkillTree = !systemSkillsLoading && !systemSkillsError;
  const filteredSystemSkillTree = useMemo(
    () => filterSystemSkillTreeNodes(systemSkillTree, deferredQuery),
    [deferredQuery, systemSkillTree],
  );
  const filteredTree = useMemo(
    () => filterTreeNodes(tree, fileById, deferredQuery),
    [deferredQuery, fileById, tree],
  );
  const searchActive = deferredQuery.trim().length > 0;

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

  return (
    <aside
      className={`${shellPanelClass} relative flex h-full min-h-0 flex-col overflow-hidden bg-[image:var(--sidebar-bg)] text-[13px] before:pointer-events-none before:absolute before:inset-x-0 before:top-[var(--app-header-height)] before:h-24 before:bg-[linear-gradient(180deg,rgba(138,108,230,0.08),transparent)] before:content-['']`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <div className="relative z-[1] flex h-[var(--app-header-height)] items-center gap-1.5 border-b border-[var(--border)] bg-[image:var(--topbar-bg)] px-2 shadow-[var(--topbar-shadow)]">
        <div className="min-w-0 flex-1">
          <SidebarSearch query={query} setQuery={setQuery} />
        </div>
        <div className="shrink-0">
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
        <div className="space-y-3 px-2 pb-3 pt-2">
          {hasSystemSkillTree ? (
            filteredSystemSkillTree.length > 0 ? (
              <SystemSkillTreeList
                compact={compact}
                expandedNodeIds={expandedSystemSkillNodeIds}
                nodes={filteredSystemSkillTree}
                onOpenSkill={openSystemSkill}
                onOpenSkillFile={openSystemSkillFile}
                openingSkillId={openingSystemSkillId}
                searchActive={searchActive}
                onToggleNode={toggleSystemSkillNode}
              />
            ) : (
              <p className="text-xs text-[var(--muted)]">
                {searchActive
                  ? "No hay resultados para esa busqueda."
                  : "No se encontraron skills con manifiesto `SKILL.md`."}
              </p>
            )
          ) : (
            <LocalTreeList
              activeFileId={activeFileId}
              compact={compact}
              fileById={fileById}
              nodes={filteredTree}
              onOpenFile={openFile}
            />
          )}
        </div>
      </div>

    </aside>
  );
}
