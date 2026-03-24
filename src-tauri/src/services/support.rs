use std::{
    collections::HashSet,
    path::{Path, PathBuf},
};

use crate::constants::SKIPPED_DIRECTORY_NAMES;

pub const SKILL_MANIFEST_NAME: &str = "SKILL.md";
pub const PREVIEW_BYTES: u64 = 16 * 1024;
pub const MAX_FILE_BYTES: u64 = 512 * 1024;
pub const MAX_SKILL_FILES: usize = 256;
pub const MAX_RESULTS: usize = 10_000;
pub const DEFAULT_SUMMARY: &str = "Skill manifest detected on disk.";

#[derive(Debug)]
pub(crate) struct SkillPreview {
    pub name: String,
    pub summary: String,
}

pub(crate) fn build_scan_roots(input_roots: Option<Vec<String>>) -> Vec<PathBuf> {
    let mut roots = Vec::new();
    let mut seen = HashSet::new();

    let raw_roots = input_roots.unwrap_or_else(default_scan_roots);

    for raw_root in raw_roots {
        let trimmed = raw_root.trim();
        if trimmed.is_empty() {
            continue;
        }

        let root = PathBuf::from(trimmed);
        if !root.exists() {
            continue;
        }

        let key = root.to_string_lossy().into_owned();
        if seen.insert(key) {
            roots.push(root);
        }
    }

    roots
}

pub(crate) fn should_skip_directory(path: &Path) -> bool {
    if !path.is_dir() {
        return false;
    }

    let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
        return false;
    };

    SKIPPED_DIRECTORY_NAMES.contains(&name)
}

pub(crate) fn is_skill_manifest(path: &Path) -> bool {
    path.is_file()
        && path
            .file_name()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case(SKILL_MANIFEST_NAME))
            .unwrap_or(false)
}

pub(crate) fn normalize_relative_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn prioritize_skill_manifest(path: &str) -> u8 {
    if path.eq_ignore_ascii_case(SKILL_MANIFEST_NAME) {
        return 0;
    }

    1
}

pub(crate) fn is_summary_candidate(line: &str) -> bool {
    !(line.starts_with('#')
        || line.starts_with('-')
        || line.starts_with('*')
        || line.starts_with("1.")
        || line.starts_with("2.")
        || line.starts_with("3.")
        || line.starts_with('`'))
}

pub(crate) fn detect_language(path: &Path) -> &'static str {
    if is_skill_manifest(path) {
        return "md";
    }

    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());

    match extension.as_deref() {
        Some("md") => "md",
        Some("json") => "json",
        Some("ts") | Some("tsx") | Some("js") | Some("jsx") | Some("mjs") | Some("cjs") => "ts",
        _ => "txt",
    }
}

pub(crate) fn slugify_path(path: &Path) -> String {
    path.file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("skill")
        .chars()
        .map(|character| match character {
            'A'..='Z' => character.to_ascii_lowercase(),
            'a'..='z' | '0'..='9' => character,
            _ => '-',
        })
        .collect()
}

pub(crate) fn classify_source(path: &Path) -> String {
    let normalized = path.to_string_lossy().to_ascii_lowercase();

    if normalized.contains(".codex/skills") || normalized.contains(".agents/skills") {
        return "managed".to_string();
    }

    if let Ok(current_dir) = std::env::current_dir() {
        let current_dir = current_dir.to_string_lossy().to_ascii_lowercase();
        if normalized.starts_with(&current_dir) {
            return "workspace".to_string();
        }
    }

    "system".to_string()
}

fn default_scan_roots() -> Vec<String> {
    let mut roots = Vec::new();

    if let Ok(current_dir) = std::env::current_dir() {
        roots.push(current_dir.to_string_lossy().into_owned());
    }

    if let Some(home_dir) = dirs::home_dir() {
        roots.push(home_dir.to_string_lossy().into_owned());
    }

    for env_key in [
        "CODEX_HOME",
        "XDG_CONFIG_HOME",
        "XDG_DATA_HOME",
        "APPDATA",
        "LOCALAPPDATA",
        "PROGRAMDATA",
    ] {
        if let Ok(value) = std::env::var(env_key) {
            roots.push(value);
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        roots.push("/opt".to_string());
        roots.push("/usr/local/share".to_string());
        roots.push("/usr/share".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        roots.push("C:\\".to_string());
    }

    roots
}
