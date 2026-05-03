import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { SystemSkill, SystemSkillTreeNode } from "../types";
import { useUiShell } from "../contexts/UiShellContext";
import { useSystemSkillsState } from "../contexts/SystemSkillsContext";
import { useWorkspaceState } from "../contexts/WorkspaceStateContext";
import {
  buildGlobalSystemSkillTree,
  buildProjectSystemSkillTree,
  buildProviderSkillGroups,
  filterSystemSkillTreeNodes,
  filterTreeNodes,
  reshapeSystemSkillRootsForDisplay,
} from "../components/navigation/sidebar/sidebarTreeUtils";
import { useIdePreferences } from "./useIdePreferences";

const SIDEBAR_PERSIST_DEBOUNCE_MS = 600;

function filterSkillsByGit(skills: SystemSkill[], onlyGitProjects: boolean): SystemSkill[] {
  if (!onlyGitProjects) {
    return skills;
  }

  return skills.filter((skill) => skill.gitRepositoryRootPath != null);
}

function filterSystemSkillTreeByGit(
  nodes: SystemSkillTreeNode[],
  onlyGitProjects: boolean,
): SystemSkillTreeNode[] {
  if (!onlyGitProjects) {
    return nodes;
  }

  return nodes
    .map((node) => {
      if (node.kind === "root" || node.kind === "directory") {
        const filteredChildren = filterSystemSkillTreeByGit(node.children, onlyGitProjects);
        if (filteredChildren.length === 0 && node.kind === "directory") {
          return null;
        }
        return { ...node, children: filteredChildren };
      }

      if (node.kind === "skill" && node.skill) {
        if (node.skill.gitRepositoryRootPath == null) {
          return null;
        }
        return node;
      }

      return node;
    })
    .filter((node): node is SystemSkillTreeNode => node !== null);
}

export function useSidebarTree() {
  const { uiState, updateUiState } = useUiShell();
  const { files, tree } = useWorkspaceState();
  const { systemSkillTree, systemSkills } = useSystemSkillsState();
  const { preferences } = useIdePreferences();
  const [expandedSystemSkillNodeIds, setExpandedSystemSkillNodeIds] = useState<Set<string>>(
    () => new Set(uiState.sidebar.expandedSystemSkillNodeIds),
  );
  const [expandedSections, setExpandedSections] = useState(() => ({
    global: uiState.sidebar.expandedSections.global,
    providers: uiState.sidebar.expandedSections.providers,
    systemSkills: uiState.sidebar.expandedSections.systemSkills,
    workspace: uiState.sidebar.expandedSections.workspace,
  }));
  const [query, setQuery] = useState(uiState.sidebar.searchQuery);
  const deferredQuery = useDeferredValue(query);
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file] as const)), [files]);
  const baseFilteredSystemSkillTree = useMemo(
    () => {
      const tree = reshapeSystemSkillRootsForDisplay(
        filterSystemSkillTreeNodes(systemSkillTree, deferredQuery),
      );
      return filterSystemSkillTreeByGit(tree, preferences.systemSkillsOnlyGitProjects);
    },
    [deferredQuery, systemSkillTree, preferences.systemSkillsOnlyGitProjects],
  );
  const filteredSystemSkillTree = useMemo(
    () => buildProjectSystemSkillTree(baseFilteredSystemSkillTree),
    [baseFilteredSystemSkillTree],
  );
  const filteredGlobalSkillTree = useMemo(
    () => buildGlobalSystemSkillTree(baseFilteredSystemSkillTree),
    [baseFilteredSystemSkillTree],
  );
  const filteredTree = useMemo(
    () => filterTreeNodes(tree, fileById, deferredQuery),
    [deferredQuery, fileById, tree],
  );
  const filteredSkillsForProviders = useMemo(
    () =>
      filterSkillsByGit(systemSkills, preferences.systemSkillsOnlyGitProjects),
    [systemSkills, preferences.systemSkillsOnlyGitProjects],
  );
  const providerSkillGroups = useMemo(
    () => buildProviderSkillGroups(filteredSkillsForProviders, deferredQuery),
    [deferredQuery, filteredSkillsForProviders],
  );
  const searchActive = deferredQuery.trim().length > 0;
  const hasWorkspaceFiles = files.length > 0;
  const hasFilteredProviderSkills = providerSkillGroups.length > 0;
  const hasFilteredGlobalSkills = filteredGlobalSkillTree.length > 0;
  const hasFilteredSystemSkills = filteredSystemSkillTree.length > 0;
  const hasFilteredWorkspaceFiles = filteredTree.length > 0;
  const globalExpanded = searchActive || expandedSections.global;
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
    filteredGlobalSkillTree,
    hasFilteredProviderSkills,
    hasFilteredGlobalSkills,
    filteredSystemSkillTree,
    filteredTree,
    globalExpanded,
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
