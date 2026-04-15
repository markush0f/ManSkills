use std::{
    collections::{HashMap, HashSet},
    fs,
    fs::File,
    io::Read,
    path::{Path, PathBuf},
    time::Instant,
};

use crate::{
    models::{MarketplaceInstallMetadata, SkillScanResponse, SystemSkill},
    services::support::{
        build_scan_roots, classify_source, is_summary_candidate,
        should_skip_directory, slugify_path, normalized_path_key, SKILL_MANIFEST_NAME,
        SkillPreview, DEFAULT_SUMMARY, MAX_RESULTS, PREVIEW_BYTES,
    },
};

use super::marketplace::MARKETPLACE_INSTALL_METADATA_FILE_NAME;

pub struct SkillCatalogService;

impl SkillCatalogService {
    pub fn new() -> Self {
        Self
    }

    pub fn scan(&self, scan_roots: Option<Vec<String>>) -> Result<SkillScanResponse, String> {
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

        let mut skills = self.discover_skills(&roots)?;
        sort_skills(&mut skills);

        Ok(SkillScanResponse {
            skills,
            scanned_roots,
            duration_ms: started_at.elapsed().as_millis(),
        })
    }

    fn discover_skills(&self, roots: &[PathBuf]) -> Result<Vec<SystemSkill>, String> {
        let mut results = HashMap::<String, SystemSkill>::new();

        for root in roots {
            if results.len() >= MAX_RESULTS {
                break;
            }

            scan_root_directories(root, &mut results);
        }

        Ok(results.values().cloned().collect())
    }
}

impl Default for SkillCatalogService {
    fn default() -> Self {
        Self::new()
    }
}

fn read_skill_preview(manifest_path: &Path, root_path: &Path) -> SkillPreview {
    let fallback_name = root_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Unnamed Skill")
        .to_string();

    let mut preview = SkillPreview {
        name: fallback_name,
        summary: DEFAULT_SUMMARY.to_string(),
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

        if preview.summary == DEFAULT_SUMMARY && is_summary_candidate(trimmed) {
            preview.summary = trimmed.to_string();
            break;
        }
    }

    preview
}

fn sort_skills(skills: &mut [SystemSkill]) {
    skills.sort_by(|left, right| {
        left.name
            .to_ascii_lowercase()
            .cmp(&right.name.to_ascii_lowercase())
            .then_with(|| left.root_path.cmp(&right.root_path))
    });
}

fn read_marketplace_install_metadata(root_path: &Path) -> Option<MarketplaceInstallMetadata> {
    let metadata_path = root_path.join(MARKETPLACE_INSTALL_METADATA_FILE_NAME);
    let content = fs::read_to_string(metadata_path).ok()?;

    serde_json::from_str(&content).ok()
}

fn scan_root_directories(root: &Path, results: &mut HashMap<String, SystemSkill>) {
    let mut stack = vec![root.to_path_buf()];
    let mut visited_directories = HashSet::<String>::new();

    while let Some(current_dir) = stack.pop() {
        if !current_dir.is_dir() {
            continue;
        }

        if should_skip_directory(&current_dir) {
            continue;
        }

        let current_key = current_dir.to_string_lossy().into_owned();
        let current_normalized_key = normalized_path_key(&current_dir);
        if !visited_directories.insert(current_normalized_key.clone()) {
            continue;
        }

        let manifest_path = current_dir.join(SKILL_MANIFEST_NAME);
        if manifest_path.is_file() {
            let preview = read_skill_preview(&manifest_path, &current_dir);
            let marketplace_install = read_marketplace_install_metadata(&current_dir);
            let skill = SystemSkill {
                id: format!("{current_key}:manifest"),
                slug: slugify_path(&current_dir),
                name: preview.name,
                summary: preview.summary,
                manifest_path: manifest_path.to_string_lossy().into_owned(),
                root_path: current_key.clone(),
                source: classify_source(&current_dir),
                marketplace_install,
            };

            results.insert(current_normalized_key, skill);
        }

        if results.len() >= MAX_RESULTS {
            break;
        }

        let Ok(entries) = fs::read_dir(&current_dir) else {
            continue;
        };

        for entry in entries.flatten() {
            let Ok(file_type) = entry.file_type() else {
                continue;
            };

            if !file_type.is_dir() || file_type.is_symlink() {
                continue;
            }

            stack.push(entry.path());
        }
    }
}
