import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useUiShell } from "../contexts/UiShellContext";
import { useSystemSkillsState } from "../contexts/SystemSkillsContext";
import { useWorkspaceState } from "../contexts/WorkspaceStateContext";
import {
  buildProviderSkillGroups,
  filterSystemSkillTreeNodes,
  filterTreeNodes,
  reshapeSystemSkillRootsForDisplay,
} from "../components/navigation/sidebar/sidebarTreeUtils";

const SIDEBAR_PERSIST_DEBOUNCE_MS = 600;

export function useSidebarTree() {
  const { uiState, updateUiState } = useUiShell();
  const { files, tree } = useWorkspaceState();
  const { systemSkillTree, systemSkills } = useSystemSkillsState();
  const [expandedSystemSkillNodeIds, setExpandedSystemSkillNodeIds] = useState<Set<string>>(
    () => new Set(uiState.sidebar.expandedSystemSkillNodeIds),
  );
  const [expandedSections, setExpandedSections] = useState(() => ({
    providers: uiState.sidebar.expandedSections.providers,
    systemSkills: uiState.sidebar.expandedSections.systemSkills,
    workspace: uiState.sidebar.expandedSections.workspace,
  }));
  const [query, setQuery] = useState(uiState.sidebar.searchQuery);
  const deferredQuery = useDeferredValue(query);
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file] as const)), [files]);
  const filteredSystemSkillTree = useMemo(
    () => reshapeSystemSkillRootsForDisplay(filterSystemSkillTreeNodes(systemSkillTree, deferredQuery)),
    [deferredQuery, systemSkillTree],
  );
  const filteredTree = useMemo(
    () => filterTreeNodes(tree, fileById, deferredQuery),
    [deferredQuery, fileById, tree],
  );
  const providerSkillGroups = useMemo(
    () => buildProviderSkillGroups(systemSkills, deferredQuery),
    [deferredQuery, systemSkills],
  );
  const searchActive = deferredQuery.trim().length > 0;
  const hasWorkspaceFiles = files.length > 0;
  const hasFilteredProviderSkills = providerSkillGroups.length > 0;
  const hasFilteredSystemSkills = filteredSystemSkillTree.length > 0;
  const hasFilteredWorkspaceFiles = filteredTree.length > 0;
  const providersExpanded = searchActive || expandedSections.providers;
  const workspaceExpanded = searchActive || expandedSections.workspace;
  const systemSkillsExpanded = searchActive || expandedSections.systemSkills;

  const pendingPersistRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (pendingPersistRef.current !== null) {
      return;
    }

    pendingPersistRef.current = window.setTimeout(() => {
      pendingPersistRef.current = null;
      updateUiState((current) => ({
        ...current,
        sidebar: {
          ...current.sidebar,
          expandedSections,
          expandedSystemSkillNodeIds: [...expandedSystemSkillNodeIds],
          searchQuery: query,
        },
      }));
    }, SIDEBAR_PERSIST_DEBOUNCE_MS);

    return () => {
      if (pendingPersistRef.current !== null) {
        window.clearTimeout(pendingPersistRef.current);
        pendingPersistRef.current = null;
      }
    };
  }, [expandedSections, expandedSystemSkillNodeIds, query, updateUiState]);

  return {
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
    query,
    searchActive,
    setQuery,
    systemSkillsExpanded,
    toggleSection,
    toggleSystemSkillNode,
    workspaceExpanded,
  };
}
