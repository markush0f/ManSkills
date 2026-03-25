use std::{
    fs,
    path::{Path, PathBuf},
};

use ignore::WalkBuilder;

use crate::{
    models::{SystemSkillContentResponse, SystemSkillFile, SystemSkillTreeFile},
    services::support::{
        detect_language, normalize_relative_path, prioritize_skill_manifest, should_skip_directory,
        MAX_FILE_BYTES, MAX_SKILL_FILES,
    },
};

pub struct SkillContentService;

impl SkillContentService {
    pub fn new() -> Self {
        Self
    }

    pub fn load_from_root<P>(&self, root_path: P) -> Result<SystemSkillContentResponse, String>
    where
        P: AsRef<str>,
    {
        let root = PathBuf::from(root_path.as_ref().trim());
        validate_skill_root(&root)?;

        let mut files = self.load_skill_files(&root);
        files.sort_by(|left, right| {
            prioritize_skill_manifest(&left.relative_path)
                .cmp(&prioritize_skill_manifest(&right.relative_path))
                .then_with(|| left.relative_path.cmp(&right.relative_path))
        });

        Ok(SystemSkillContentResponse {
            root_path: root.to_string_lossy().into_owned(),
            files,
        })
    }

    pub fn list_from_root<P>(&self, root_path: P) -> Result<Vec<SystemSkillTreeFile>, String>
    where
        P: AsRef<str>,
    {
        let root = PathBuf::from(root_path.as_ref().trim());
        validate_skill_root(&root)?;

        Ok(self.list_skill_files(&root))
    }

    pub fn save_file<P, Q, C>(
        &self,
        root_path: P,
        relative_path: Q,
        content: C,
    ) -> Result<(), String>
    where
        P: AsRef<str>,
        Q: AsRef<str>,
        C: AsRef<str>,
    {
        let root = PathBuf::from(root_path.as_ref().trim());
        let canonical_root = canonicalize_skill_root(&root)?;
        let file_path = resolve_skill_file_path(&canonical_root, relative_path.as_ref())?;

        fs::write(file_path, content.as_ref())
            .map_err(|error| format!("Failed to write skill file: {error}"))
    }

    fn load_skill_files(&self, root: &Path) -> Vec<SystemSkillFile> {
        let mut discovered_files = Vec::new();

        for entry_result in WalkBuilder::new(root)
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

            let Ok(relative_path) = path.strip_prefix(root) else {
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

        discovered_files
    }

    fn list_skill_files(&self, root: &Path) -> Vec<SystemSkillTreeFile> {
        let mut discovered_files = Vec::new();

        for entry_result in WalkBuilder::new(root)
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

            let Ok(relative_path) = path.strip_prefix(root) else {
                continue;
            };

            let Ok(metadata) = entry.metadata() else {
                continue;
            };

            if metadata.len() > MAX_FILE_BYTES {
                continue;
            }

            let relative_path = normalize_relative_path(relative_path);

            discovered_files.push(SystemSkillTreeFile {
                id: format!("{}:{}", root.to_string_lossy(), relative_path),
                relative_path,
                language: detect_language(path).to_string(),
            });

            if discovered_files.len() >= MAX_SKILL_FILES {
                break;
            }
        }

        discovered_files
    }
}

impl Default for SkillContentService {
    fn default() -> Self {
        Self::new()
    }
}

fn validate_skill_root(root: &Path) -> Result<(), String> {
    if !root.exists() {
        return Err("Skill root does not exist".to_string());
    }

    if !root.is_dir() {
        return Err("Skill root is not a directory".to_string());
    }

    Ok(())
}

fn canonicalize_skill_root(root: &Path) -> Result<PathBuf, String> {
    validate_skill_root(root)?;

    fs::canonicalize(root).map_err(|error| format!("Failed to resolve skill root: {error}"))
}

fn resolve_skill_file_path(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let trimmed_relative_path = relative_path.trim();
    if trimmed_relative_path.is_empty() {
        return Err("Skill file path is empty".to_string());
    }

    let relative_path = Path::new(trimmed_relative_path);
    if relative_path.is_absolute() {
        return Err("Skill file path must be relative".to_string());
    }

    let candidate_path = root.join(relative_path);
    let canonical_candidate =
        fs::canonicalize(&candidate_path).map_err(|_| "Skill file does not exist".to_string())?;

    if !canonical_candidate.starts_with(root) {
        return Err("Skill file path escapes the skill root".to_string());
    }

    if !canonical_candidate.is_file() {
        return Err("Skill file is not a regular file".to_string());
    }

    Ok(canonical_candidate)
}
