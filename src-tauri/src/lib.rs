use ignore::WalkBuilder;
use serde::Serialize;
use std::{
    collections::HashSet,
    fs,
    fs::File,
    io::Read,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::Instant,
};

const SKILL_MANIFEST_NAME: &str = "SKILL.md";
const PREVIEW_BYTES: u64 = 16 * 1024;
const MAX_FILE_BYTES: u64 = 512 * 1024;
const MAX_SKILL_FILES: usize = 256;
const MAX_RESULTS: usize = 10_000;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemSkill {
    id: String,
    slug: String,
    name: String,
    summary: String,
    manifest_path: String,
    root_path: String,
    source: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SkillScanResponse {
    skills: Vec<SystemSkill>,
    scanned_roots: Vec<String>,
    duration_ms: u128,
}

#[derive(Debug)]
struct SkillPreview {
    name: String,
    summary: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemSkillFile {
    id: String,
    relative_path: String,
    language: String,
    content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemSkillContentResponse {
    root_path: String,
    files: Vec<SystemSkillFile>,
}

#[tauri::command]
fn scan_system_skills(scan_roots: Option<Vec<String>>) -> Result<SkillScanResponse, String> {
    let started_at = Instant::now();
    let roots = build_scan_roots(scan_roots);

    if roots.is_empty() {
        return Ok(SkillScanResponse {
            skills: Vec::new(),
            scanned_roots: Vec::new(),
            duration_ms: 0,
        });
    }

    let scanned_roots = roots
        .iter()
        .map(|path| path.to_string_lossy().into_owned())
        .collect::<Vec<_>>();

    let results = Arc::new(Mutex::new(Vec::<SystemSkill>::new()));
    let seen_manifests = Arc::new(Mutex::new(HashSet::<String>::new()));
    let thread_count = std::thread::available_parallelism()
        .map(|value| value.get())
        .unwrap_or(4);

    for root in roots {
        let results = Arc::clone(&results);
        let seen_manifests = Arc::clone(&seen_manifests);

        WalkBuilder::new(root)
            .hidden(false)
            .follow_links(false)
            .git_ignore(true)
            .git_global(true)
            .git_exclude(true)
            .threads(thread_count)
            .filter_entry(|entry| !should_skip_directory(entry.path()))
            .build_parallel()
            .run(|| {
                let results = Arc::clone(&results);
                let seen_manifests = Arc::clone(&seen_manifests);

                Box::new(move |entry_result| {
                    let Ok(entry) = entry_result else {
                        return ignore::WalkState::Continue;
                    };

                    let path = entry.path();
                    if !is_skill_manifest(path) {
                        return ignore::WalkState::Continue;
                    }

                    let manifest_key = path.to_string_lossy().into_owned();

                    {
                        let mut seen = seen_manifests.lock().expect("manifest set poisoned");
                        if !seen.insert(manifest_key.clone()) {
                            return ignore::WalkState::Continue;
                        }
                    }

                    let Some(root_path) = path.parent() else {
                        return ignore::WalkState::Continue;
                    };

                    let preview = read_skill_preview(path, root_path);
                    let skill = SystemSkill {
                        id: manifest_key.clone(),
                        slug: slugify_path(root_path),
                        name: preview.name,
                        summary: preview.summary,
                        manifest_path: manifest_key,
                        root_path: root_path.to_string_lossy().into_owned(),
                        source: classify_source(root_path),
                    };

                    let mut results = results.lock().expect("results poisoned");
                    if results.len() >= MAX_RESULTS {
                        return ignore::WalkState::Quit;
                    }

                    results.push(skill);
                    ignore::WalkState::Continue
                })
            });
    }

    let mut skills = {
        let results = results
            .lock()
            .map_err(|_| "scan results lock poisoned".to_string())?;
        results.clone()
    };

    skills.sort_by(|left, right| {
        left.name
            .to_ascii_lowercase()
            .cmp(&right.name.to_ascii_lowercase())
            .then_with(|| left.root_path.cmp(&right.root_path))
    });

    Ok(SkillScanResponse {
        skills,
        scanned_roots,
        duration_ms: started_at.elapsed().as_millis(),
    })
}

#[tauri::command]
fn load_system_skill(root_path: String) -> Result<SystemSkillContentResponse, String> {
    let root = PathBuf::from(root_path.trim());
    if !root.exists() {
        return Err("Skill root does not exist".to_string());
    }

    if !root.is_dir() {
        return Err("Skill root is not a directory".to_string());
    }

    let mut discovered_files = Vec::new();

    for entry_result in WalkBuilder::new(&root)
        .hidden(false)
        .follow_links(false)
        .git_ignore(false)
        .git_global(false)
        .git_exclude(false)
        .filter_entry(|entry| !should_skip_directory(entry.path()))
        .build()
    {
        let Ok(entry) = entry_result else {
            continue;
        };

        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let Ok(relative_path) = path.strip_prefix(&root) else {
            continue;
        };

        let Ok(metadata) = entry.metadata() else {
            continue;
        };

        if metadata.len() > MAX_FILE_BYTES {
            continue;
        }

        let Ok(bytes) = fs::read(path) else {
            continue;
        };

        let relative_path = normalize_relative_path(relative_path);
        let content = String::from_utf8_lossy(&bytes).into_owned();

        discovered_files.push(SystemSkillFile {
            id: format!("{}:{}", root.to_string_lossy(), relative_path),
            relative_path: relative_path.clone(),
            language: detect_language(path).to_string(),
            content,
        });

        if discovered_files.len() >= MAX_SKILL_FILES {
            break;
        }
    }

    discovered_files.sort_by(|left, right| {
        prioritize_skill_manifest(&left.relative_path)
            .cmp(&prioritize_skill_manifest(&right.relative_path))
            .then_with(|| left.relative_path.cmp(&right.relative_path))
    });

    Ok(SystemSkillContentResponse {
        root_path: root.to_string_lossy().into_owned(),
        files: discovered_files,
    })
}

fn build_scan_roots(input_roots: Option<Vec<String>>) -> Vec<PathBuf> {
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

fn should_skip_directory(path: &Path) -> bool {
    if !path.is_dir() {
        return false;
    }

    let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
        return false;
    };

    matches!(
        name,
        ".git"
            | ".hg"
            | ".svn"
            | "node_modules"
            | "target"
            | "dist"
            | "build"
            | ".next"
            | ".nuxt"
            | ".turbo"
            | ".venv"
            | "venv"
            | "__pycache__"
            | ".cache"
            | "proc"
            | "sys"
            | "dev"
            | "run"
            | "tmp"
            | "var"
            | "Library"
    )
}

fn is_skill_manifest(path: &Path) -> bool {
    path.is_file()
        && path
            .file_name()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case(SKILL_MANIFEST_NAME))
            .unwrap_or(false)
}

fn normalize_relative_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn prioritize_skill_manifest(path: &str) -> u8 {
    if path.eq_ignore_ascii_case(SKILL_MANIFEST_NAME) {
        return 0;
    }

    1
}

fn read_skill_preview(manifest_path: &Path, root_path: &Path) -> SkillPreview {
    let fallback_name = root_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Unnamed Skill")
        .to_string();

    let mut preview = SkillPreview {
        name: fallback_name,
        summary: "Skill manifest detected on disk.".to_string(),
    };

    let Ok(file) = File::open(manifest_path) else {
        return preview;
    };

    let mut content = String::new();
    if file
        .take(PREVIEW_BYTES)
        .read_to_string(&mut content)
        .is_err()
    {
        return preview;
    }

    let mut in_code_block = false;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("```") {
            in_code_block = !in_code_block;
            continue;
        }

        if in_code_block || trimmed.is_empty() {
            continue;
        }

        if let Some(name) = trimmed.strip_prefix("# ") {
            preview.name = name.trim().to_string();
            continue;
        }

        if preview.summary == "Skill manifest detected on disk." && is_summary_candidate(trimmed) {
            preview.summary = trimmed.to_string();
            break;
        }
    }

    preview
}

fn is_summary_candidate(line: &str) -> bool {
    !(line.starts_with('#')
        || line.starts_with('-')
        || line.starts_with('*')
        || line.starts_with("1.")
        || line.starts_with("2.")
        || line.starts_with("3.")
        || line.starts_with('`'))
}

fn detect_language(path: &Path) -> &'static str {
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

fn slugify_path(path: &Path) -> String {
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

fn classify_source(path: &Path) -> String {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_system_skills,
            load_system_skill
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{is_summary_candidate, slugify_path};
    use std::path::Path;

    #[test]
    fn slugify_path_normalizes_directory_name() {
        assert_eq!(slugify_path(Path::new("/tmp/My Skill")), "my-skill");
    }

    #[test]
    fn summary_candidates_ignore_markdown_structure() {
        assert!(!is_summary_candidate("# Heading"));
        assert!(!is_summary_candidate("- item"));
        assert!(is_summary_candidate("Short summary line"));
    }
}
