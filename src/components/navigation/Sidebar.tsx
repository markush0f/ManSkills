import { useMemo, useState } from "react";

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
  const hasSystemSkillTree = !systemSkillsLoading && !systemSkillsError;
  const filteredSystemSkillTree = useMemo(
    () => filterSystemSkillTreeNodes(systemSkillTree, query),
    [query, systemSkillTree],
  );
  const filteredTree = useMemo(() => filterTreeNodes(tree, files, query), [files, query, tree]);
  const searchActive = query.trim().length > 0;

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
      className={`${shellPanelClass} flex h-full min-h-0 flex-col overflow-hidden text-[13px]`}
      style={{ fontFamily: "var(--font-soft)" }}
    >
      <SidebarSearch query={query} setQuery={setQuery} />

      <div className={`flex-1 overflow-auto ${compact ? "px-2 py-2" : "px-2 py-2"}`}>
        <div className="space-y-4">
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
              files={files}
              nodes={filteredTree}
              onOpenFile={openFile}
            />
          )}
        </div>
      </div>

      <SidebarFooter
        compact={compact}
        isMarketplaceView={isMarketplaceView}
        isSettingsView={isSettingsView}
        openMarketplace={openMarketplace}
        openSettings={openSettings}
      />
    </aside>
  );
}
