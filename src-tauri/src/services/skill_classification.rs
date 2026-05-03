use std::{collections::HashSet, fs, path::PathBuf};

use serde::{Deserialize, Serialize};

use crate::{constants::SKIPPED_DIRECTORY_NAMES, models::SkillClassificationSettings};

const SETTINGS_DIRECTORY_NAME: &str = "skills-ide";
const SETTINGS_FILE_NAME: &str = "skill-classification.json";
const SETTINGS_FORMAT_VERSION: u8 = 1;
const DEFAULT_GLOBAL_ROOTS: &[&str] = &[
    ".agents",
    ".codex",
    ".claude",
    ".cursor",
    ".windsurf",
    ".roo",
    ".gemini",
    ".kiro",
    ".goose",
];

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredSkillClassificationSettings {
    #[serde(default)]
    version: u8,
    #[serde(flatten)]
    settings: SkillClassificationSettings,
}

pub struct SkillClassificationService;

impl SkillClassificationService {
    pub fn new() -> Self {
        Self
    }

    pub fn load(&self) -> Result<SkillClassificationSettings, String> {
        let path = settings_file_path()?;
        if !path.exists() {
            return Ok(default_settings());
        }

        let content = fs::read_to_string(&path)
            .map_err(|error| format!("Failed to read skill classification settings: {error}"))?;

        let stored = serde_json::from_str::<StoredSkillClassificationSettings>(&content)
            .map_err(|error| format!("Failed to parse skill classification settings: {error}"))?;

        Ok(resolve_loaded_settings(stored))
    }

    pub fn save(
        &self,
        settings: SkillClassificationSettings,
    ) -> Result<SkillClassificationSettings, String> {
        let normalized = normalize_settings(settings);
        let path = settings_file_path()?;
        let parent = path
            .parent()
            .ok_or("Failed to resolve skill classification settings directory")?;

        fs::create_dir_all(parent).map_err(|error| {
            format!("Failed to create skill classification settings directory: {error}")
        })?;

        let content = serde_json::to_string_pretty(&StoredSkillClassificationSettings {
            version: SETTINGS_FORMAT_VERSION,
            settings: normalized.clone(),
        })
        .map_err(|error| format!("Failed to serialize skill classification settings: {error}"))?;

        fs::write(&path, content)
            .map_err(|error| format!("Failed to write skill classification settings: {error}"))?;

        Ok(normalized)
    }

    pub fn effective_global_roots(&self) -> Vec<String> {
        self.load()
            .unwrap_or_else(|_| default_settings())
            .global_roots
    }

    pub fn effective_hidden_directories(&self) -> HashSet<String> {
        self.load()
            .unwrap_or_else(|_| default_settings())
            .hidden_directories
            .into_iter()
            .collect()
    }

    pub fn effective_scan_root_home_directories(&self) -> Vec<String> {
        let mut roots = Vec::new();

        for root in self.effective_global_roots() {
            let normalized_root = root.trim_start_matches('.');
            if normalized_root.is_empty() {
                continue;
            }

            roots.push(format!("{root}/skills"));
            roots.push(format!(".config/{normalized_root}/skills"));
            roots.push(format!(".local/share/{normalized_root}/skills"));
            roots.push(format!("AppData/Roaming/{normalized_root}/skills"));
            roots.push(format!("AppData/Local/{normalized_root}/skills"));
        }

        merge_unique(Vec::new(), roots, normalize_relative_root)
    }

    pub fn effective_custom_scan_roots(&self) -> Vec<String> {
        let loaded = self.load().unwrap_or_default();
        merge_unique(Vec::new(), loaded.custom_scan_roots, normalize_scan_root)
    }
}

impl Default for SkillClassificationService {
    fn default() -> Self {
        Self::new()
    }
}

fn settings_file_path() -> Result<PathBuf, String> {
    let base_dir = dirs::config_dir().ok_or("Could not resolve config directory")?;
    Ok(base_dir
        .join(SETTINGS_DIRECTORY_NAME)
        .join(SETTINGS_FILE_NAME))
}

fn default_settings() -> SkillClassificationSettings {
    SkillClassificationSettings {
        global_roots: DEFAULT_GLOBAL_ROOTS
            .iter()
            .map(|value| value.to_string())
            .collect(),
        provider_directories: DEFAULT_GLOBAL_ROOTS
            .iter()
            .filter_map(|value| normalize_provider_directory(value))
            .collect(),
        hidden_directories: SKIPPED_DIRECTORY_NAMES
            .iter()
            .filter_map(|value| normalize_directory_name(value))
            .collect(),
        custom_scan_roots: Vec::new(),
    }
}

fn resolve_loaded_settings(
    stored: StoredSkillClassificationSettings,
) -> SkillClassificationSettings {
    let normalized = normalize_settings(stored.settings);
    if stored.version >= SETTINGS_FORMAT_VERSION {
        return normalized;
    }

    let defaults = default_settings();
    SkillClassificationSettings {
        global_roots: merge_unique(
            defaults.global_roots,
            normalized.global_roots,
            normalize_global_root,
        ),
        provider_directories: merge_unique(
            defaults.provider_directories,
            normalized.provider_directories,
            normalize_provider_directory,
        ),
        hidden_directories: merge_unique(
            defaults.hidden_directories,
            normalized.hidden_directories,
            normalize_directory_name,
        ),
        custom_scan_roots: normalized.custom_scan_roots,
    }
}

fn normalize_settings(settings: SkillClassificationSettings) -> SkillClassificationSettings {
    SkillClassificationSettings {
        global_roots: merge_unique(Vec::new(), settings.global_roots, normalize_global_root),
        provider_directories: merge_unique(
            Vec::new(),
            settings.provider_directories,
            normalize_provider_directory,
        ),
        hidden_directories: merge_unique(
            Vec::new(),
            settings.hidden_directories,
            normalize_directory_name,
        ),
        custom_scan_roots: merge_unique(
            Vec::new(),
            settings.custom_scan_roots,
            normalize_scan_root,
        ),
    }
}

fn merge_unique(
    initial: Vec<String>,
    values: Vec<String>,
    normalize: fn(&str) -> Option<String>,
) -> Vec<String> {
    let mut merged = Vec::new();
    let mut seen = HashSet::new();

    for value in initial.into_iter().chain(values) {
        let Some(normalized) = normalize(&value) else {
            continue;
        };

        let key = normalized.to_ascii_lowercase();
        if seen.insert(key) {
            merged.push(normalized);
        }
    }

    merged
}

fn normalize_global_root(value: &str) -> Option<String> {
    let trimmed = value.trim().replace('\\', "/");
    if trimmed.is_empty() {
        return None;
    }

    let without_trailing = trimmed.trim_end_matches('/');
    if without_trailing.is_empty() {
        return None;
    }

    Some(if without_trailing.starts_with('.') {
        without_trailing.to_string()
    } else {
        format!(".{without_trailing}")
    })
}

fn normalize_provider_directory(value: &str) -> Option<String> {
    let trimmed = value.trim().replace('\\', "/");
    let normalized = trimmed.trim_matches('/').trim_start_matches('.').trim();
    if normalized.is_empty() {
        return None;
    }

    Some(normalized.to_ascii_lowercase())
}

fn normalize_directory_name(value: &str) -> Option<String> {
    let trimmed = value.trim().trim_matches('/').trim_matches('\\');
    if trimmed.is_empty() {
        return None;
    }

    Some(trimmed.to_ascii_lowercase())
}

fn normalize_relative_root(value: &str) -> Option<String> {
    let trimmed = value.trim().replace('\\', "/");
    let normalized = trimmed.trim_matches('/');
    if normalized.is_empty() {
        return None;
    }

    Some(normalized.to_string())
}

fn normalize_scan_root(value: &str) -> Option<String> {
    let trimmed = value.trim().replace('\\', "/");
    if trimmed.is_empty() {
        return None;
    }

    Some(trimmed.trim_end_matches('/').to_string())
}

#[cfg(test)]
mod tests {
    use super::{
        default_settings, normalize_directory_name, normalize_global_root,
        normalize_provider_directory, normalize_scan_root, resolve_loaded_settings,
        StoredSkillClassificationSettings,
    };

    #[test]
    fn normalize_global_root_adds_dot_prefix() {
        assert_eq!(normalize_global_root("markus").as_deref(), Some(".markus"));
        assert_eq!(normalize_global_root(".claude").as_deref(), Some(".claude"));
    }

    #[test]
    fn normalize_provider_directory_strips_dot_prefix() {
        assert_eq!(
            normalize_provider_directory(".markus").as_deref(),
            Some("markus")
        );
        assert_eq!(
            normalize_provider_directory("Codex").as_deref(),
            Some("codex")
        );
    }

    #[test]
    fn normalize_directory_name_lowercases_values() {
        assert_eq!(
            normalize_directory_name("Node_Modules").as_deref(),
            Some("node_modules")
        );
    }

    #[test]
    fn normalize_scan_root_trims_trailing_separators() {
        assert_eq!(
            normalize_scan_root("C:/skills/").as_deref(),
            Some("C:/skills")
        );
    }

    #[test]
    fn load_defaults_when_no_version_is_present() {
        let settings = resolve_loaded_settings(StoredSkillClassificationSettings {
            version: 0,
            settings: crate::models::SkillClassificationSettings {
                global_roots: vec![".markus".to_string()],
                provider_directories: vec!["markus".to_string()],
                hidden_directories: vec!["coverage-cache".to_string()],
                custom_scan_roots: vec!["C:/skills".to_string()],
            },
        });

        assert!(settings.global_roots.contains(&".claude".to_string()));
        assert!(settings.global_roots.contains(&".markus".to_string()));
        assert!(settings
            .provider_directories
            .contains(&"claude".to_string()));
        assert!(settings
            .provider_directories
            .contains(&"markus".to_string()));
        assert!(settings
            .hidden_directories
            .contains(&"node_modules".to_string()));
        assert!(settings
            .hidden_directories
            .contains(&"coverage-cache".to_string()));
        assert_eq!(settings.custom_scan_roots, vec!["C:/skills".to_string()]);
    }

    #[test]
    fn versioned_settings_replace_defaults() {
        let defaults = default_settings();
        let settings = resolve_loaded_settings(StoredSkillClassificationSettings {
            version: 1,
            settings: crate::models::SkillClassificationSettings {
                global_roots: vec![".markus".to_string()],
                provider_directories: vec!["markus".to_string()],
                hidden_directories: vec!["coverage-cache".to_string()],
                custom_scan_roots: vec!["C:/skills".to_string()],
            },
        });

        assert_eq!(settings.global_roots, vec![".markus".to_string()]);
        assert_eq!(settings.provider_directories, vec!["markus".to_string()]);
        assert_eq!(
            settings.hidden_directories,
            vec!["coverage-cache".to_string()]
        );
        assert_eq!(settings.custom_scan_roots, vec!["C:/skills".to_string()]);
        assert!(defaults.global_roots.contains(&".claude".to_string()));
        assert!(!settings.global_roots.contains(&".claude".to_string()));
    }
}
