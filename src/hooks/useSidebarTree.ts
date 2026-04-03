import { useDeferredValue, useMemo, useState } from "react";
import { useSystemSkillsState } from "../contexts/SystemSkillsContext";
import { useWorkspaceState } from "../contexts/WorkspaceStateContext";
import { filterSystemSkillTreeNodes, filterTreeNodes } from "../components/navigation/sidebar/sidebarTreeUtils";

export function useSidebarTree() {
  const { files, tree } = useWorkspaceState();
  const { systemSkillTree } = useSystemSkillsState();
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

  return {
    expandedSystemSkillNodeIds,
    fileById,
    filteredSystemSkillTree,
    filteredTree,
    hasFilteredSystemSkills,
    hasFilteredWorkspaceFiles,
    hasWorkspaceFiles,
    query,
    searchActive,
    setQuery,
    systemSkillsExpanded,
    toggleSection,
    toggleSystemSkillNode,
    workspaceExpanded,
  };
}
