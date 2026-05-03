import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { SkillClassificationSettings } from "../types";

const DEFAULT_SKILL_CLASSIFICATION_SETTINGS: SkillClassificationSettings = {
  customScanRoots: [],
  globalRoots: [".agents", ".codex", ".claude", ".cursor", ".windsurf", ".roo", ".gemini", ".kiro", ".goose"],
  hiddenDirectories: [
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".turbo",
    ".venv",
    "venv",
    "__pycache__",
    ".cache",
    "proc",
    "sys",
    "dev",
    "run",
    "tmp",
    "var",
    "library",
  ],
  providerDirectories: ["agents", "codex", "claude", "cursor", "windsurf", "roo", "gemini", "kiro", "goose"],
};

export function useSkillClassificationSettings() {
  const [skillClassificationSettings, setSkillClassificationSettings] = useState<SkillClassificationSettings>(
    DEFAULT_SKILL_CLASSIFICATION_SETTINGS,
  );
  const [skillClassificationSettingsLoading, setSkillClassificationSettingsLoading] = useState(true);
  const [skillClassificationSettingsError, setSkillClassificationSettingsError] = useState<string | null>(null);

  function refreshSkillClassificationSettings() {
    setSkillClassificationSettingsLoading(true);
    setSkillClassificationSettingsError(null);

    return invoke<SkillClassificationSettings>("load_skill_classification_settings")
      .then((settings) => {
        setSkillClassificationSettings(settings);
        setSkillClassificationSettingsError(null);
        setSkillClassificationSettingsLoading(false);
        return settings;
      })
      .catch((error) => {
        setSkillClassificationSettingsError("Could not load skill classification settings.");
        setSkillClassificationSettingsLoading(false);
        throw error;
      });
  }

  function saveSkillClassificationSettings(settings: SkillClassificationSettings) {
    setSkillClassificationSettingsError(null);

    return invoke<SkillClassificationSettings>("save_skill_classification_settings", { settings })
      .then((savedSettings) => {
        setSkillClassificationSettings(savedSettings);
        return savedSettings;
      })
      .catch((error) => {
        setSkillClassificationSettingsError("Could not save skill classification settings.");
        throw error;
      });
  }

  useEffect(() => {
    void refreshSkillClassificationSettings().catch(() => undefined);
  }, []);

  return {
    refreshSkillClassificationSettings,
    saveSkillClassificationSettings,
    skillClassificationSettings,
    skillClassificationSettingsError,
    skillClassificationSettingsLoading,
  };
}
