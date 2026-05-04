use std::{
    collections::HashSet,
    fs::File,
    io::Read,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::Instant,
};

use ignore::WalkBuilder;

use crate::{
    models::{SkillScanResponse, SystemSkill},
    services::support::{
        build_scan_roots, classify_source, is_skill_manifest, is_summary_candidate,
        should_skip_directory, slugify_path, SkillPreview, DEFAULT_SUMMARY, MAX_RESULTS,
        PREVIEW_BYTES,
    },
};

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

        let results = results
            .lock()
            .map_err(|_| "scan results lock poisoned".to_string())?;

        Ok(results.clone())
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
