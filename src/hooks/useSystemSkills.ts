import { invoke } from "@tauri-apps/api/core";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  attachSystemSkillFileTree,
  collectSystemSkillIds,
  flattenSystemSkillTree,
  toSystemSkillTreeFiles,
} from "../ide/systemSkills";
import type {
  SkillTreeResponse,
  SystemSkill,
  SystemSkillContentResponse,
  SystemSkillFile,
  SystemSkillTreeFile,
  SystemSkillTreeNode,
} from "../types";

function addPendingSkillId(current: Set<string>, skillId: string) {
  const next = new Set(current);
  next.add(skillId);
  return next;
}

function removePendingSkillId(current: Set<string>, skillId: string) {
  if (!current.has(skillId)) {
    return current;
  }

  const next = new Set(current);
  next.delete(skillId);
  return next;
}

export function useSystemSkills() {
  const [baseSystemSkillTree, setBaseSystemSkillTree] = useState<SystemSkillTreeNode[]>([]);
  const [systemSkills, setSystemSkills] = useState<SystemSkill[]>([]);
  const [systemSkillFilesBySkillId, setSystemSkillFilesBySkillId] = useState<Record<string, SystemSkillTreeFile[]>>(
    {},
  );
  const [systemSkillsLoading, setSystemSkillsLoading] = useState(true);
  const [systemSkillsError, setSystemSkillsError] = useState<string | null>(null);
  const [systemSkillActionError, setSystemSkillActionError] = useState<string | null>(null);
  const [systemSkillScanMs, setSystemSkillScanMs] = useState<number | null>(null);
  const [openingSystemSkillIds, setOpeningSystemSkillIds] = useState<Set<string>>(() => new Set());
  const [listingSystemSkillIds, setListingSystemSkillIds] = useState<Set<string>>(() => new Set());

  const systemSkillTree = useMemo(
    () => attachSystemSkillFileTree(baseSystemSkillTree, systemSkillFilesBySkillId),
    [baseSystemSkillTree, systemSkillFilesBySkillId],
  );
  const systemSkillByRootPath = useMemo(
    () => new Map(systemSkills.map((skill) => [skill.rootPath, skill] as const)),
    [systemSkills],
  );
  const listedSystemSkillIds = useMemo(
    () => new Set(Object.keys(systemSkillFilesBySkillId)),
    [systemSkillFilesBySkillId],
  );

  function applySystemSkillTree(response: SkillTreeResponse) {
    const nextSystemSkills = flattenSystemSkillTree(response.roots);
    const nextSkillIds = collectSystemSkillIds(response.roots);

    startTransition(() => {
      setBaseSystemSkillTree(response.roots);
      setSystemSkills(nextSystemSkills);
      setSystemSkillFilesBySkillId((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([skillId]) => nextSkillIds.has(skillId)),
        ),
      );
      setSystemSkillScanMs(response.durationMs);
      setSystemSkillsError(null);
      setSystemSkillsLoading(false);
    });
  }

  function registerSkillFiles(skillId: string, files: SystemSkillTreeFile[] | SystemSkillFile[]) {
    const normalizedFiles = "content" in (files[0] ?? {})
      ? toSystemSkillTreeFiles(files as SystemSkillFile[])
      : (files as SystemSkillTreeFile[]);

    startTransition(() => {
      setSystemSkillFilesBySkillId((current) => ({
        ...current,
        [skillId]: normalizedFiles,
      }));
    });
  }

  function refreshSystemSkillTree() {
    setSystemSkillsLoading(true);
    setSystemSkillsError(null);

    return invoke<SkillTreeResponse>("scan_system_skills_tree")
      .then((response) => {
        applySystemSkillTree(response);
        return response;
      })
      .catch((error) => {
        setSystemSkillsError("No se pudieron cargar las skills del sistema.");
        setSystemSkillsLoading(false);
        throw error;
      });
  }

  function listSystemSkillFiles(skill: SystemSkill, options?: { force?: boolean }) {
    if (!options?.force && systemSkillFilesBySkillId[skill.id]) {
      return Promise.resolve(systemSkillFilesBySkillId[skill.id]);
    }

    setSystemSkillActionError(null);
    setListingSystemSkillIds((current) => addPendingSkillId(current, skill.id));

    return invoke<SystemSkillTreeFile[]>("list_system_skill_files", {
      rootPath: skill.rootPath,
    })
      .then((files) => {
        registerSkillFiles(skill.id, files);
        return files;
      })
      .catch((error) => {
        setSystemSkillActionError("No se pudo listar la skill seleccionada.");
        throw error;
      })
      .finally(() => {
        setListingSystemSkillIds((current) => removePendingSkillId(current, skill.id));
      });
  }

  function loadSystemSkillFiles(skill: SystemSkill) {
    setSystemSkillActionError(null);
    setOpeningSystemSkillIds((current) => addPendingSkillId(current, skill.id));

    return invoke<SystemSkillContentResponse>("load_system_skill", {
      rootPath: skill.rootPath,
    })
      .then((response) => {
        registerSkillFiles(skill.id, response.files);
        return response;
      })
      .catch((error) => {
        setSystemSkillActionError("No se pudo abrir la skill seleccionada.");
        throw error;
      })
      .finally(() => {
        setOpeningSystemSkillIds((current) => removePendingSkillId(current, skill.id));
      });
  }

  useEffect(() => {
    let cancelled = false;

    invoke<SkillTreeResponse>("scan_system_skills_tree")
      .then((response) => {
        if (cancelled) {
          return;
        }

        applySystemSkillTree(response);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setBaseSystemSkillTree([]);
        setSystemSkills([]);
        setSystemSkillScanMs(null);
        setSystemSkillsError("No se pudieron cargar las skills del sistema.");
        setSystemSkillsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    clearSystemSkillActionError: () => setSystemSkillActionError(null),
    listSystemSkillFiles,
    listedSystemSkillIds,
    listingSystemSkillIds,
    loadSystemSkillFiles,
    openingSystemSkillIds,
    refreshSystemSkillTree,
    registerLoadedSystemSkillFiles: registerSkillFiles,
    systemSkillActionError,
    systemSkillByRootPath,
    systemSkillFilesBySkillId,
    systemSkillScanMs,
    systemSkillTree,
    systemSkills,
    systemSkillsError,
    systemSkillsLoading,
  };
}
