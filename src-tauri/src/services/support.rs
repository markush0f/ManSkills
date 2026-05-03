use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

use crate::constants::{
    MANAGED_SKILL_SOURCE_PATTERNS, PROVIDER_SCAN_ROOT_ENV_KEYS, PROVIDER_WATCH_ROOT_ENV_KEYS,
};

use super::SkillClassificationService;

pub const SKILL_MANIFEST_NAME: &str = "SKILL.md";
pub const PREVIEW_BYTES: u64 = 16 * 1024;
pub const MAX_RESULTS: usize = 10_000;
pub const DEFAULT_SUMMARY: &str = "Skill manifest detected on disk.";

#[derive(Debug)]
pub(crate) struct SkillPreview {
    pub name: String,
    pub summary: String,
}

pub(crate) fn build_scan_roots(input_roots: Option<Vec<String>>) -> Vec<PathBuf> {
    let raw_roots = input_roots.unwrap_or_else(default_scan_roots);
    build_roots(raw_roots)
}

pub(crate) fn build_watch_roots(input_roots: Option<Vec<String>>) -> Vec<PathBuf> {
    let raw_roots = input_roots.unwrap_or_else(default_watch_roots);
    build_roots(raw_roots)
}

fn build_roots(raw_roots: Vec<String>) -> Vec<PathBuf> {
    let mut roots = Vec::new();
    let mut seen = HashSet::new();

    for raw_root in raw_roots {
        let trimmed = raw_root.trim();
        if trimmed.is_empty() {
            continue;
        }

        let root = PathBuf::from(trimmed);
        if !root.exists() {
            continue;
        }

        let canonical = canonicalize_or_self(&root);
        let key = normalized_path_key(&canonical);
        if seen.insert(key) {
            roots.push(canonical);
        }
    }

    roots
}

fn canonicalize_or_self(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

pub(crate) fn normalized_path_key(path: &Path) -> String {
    let canonical = canonicalize_or_self(path);
    let mut normalized = canonical
        .to_string_lossy()
        .replace('\\', "/")
        .to_ascii_lowercase();

    if let Some(stripped) = normalized.strip_prefix("//?/") {
        normalized = stripped.to_string();
    }

    while normalized.len() > 1 && normalized.ends_with('/') {
        normalized.pop();
    }

    normalized
}

pub(crate) fn build_skip_directory_names() -> HashSet<String> {
    SkillClassificationService::new().effective_hidden_directories()
}

pub(crate) fn should_skip_directory(path: &Path, skip_directory_names: &HashSet<String>) -> bool {
    if !path.is_dir() {
        return false;
    }

    let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
        return false;
    };

    skip_directory_names.contains(&name.to_ascii_lowercase())
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
    let normalized = normalized_path_key(path);

    if MANAGED_SKILL_SOURCE_PATTERNS
        .iter()
        .any(|pattern| normalized.contains(pattern))
    {
        return "managed".to_string();
    }

    if let Ok(current_dir) = std::env::current_dir() {
        let current_dir = normalized_path_key(&current_dir);
        if normalized == current_dir || normalized.starts_with(&format!("{current_dir}/")) {
            return "workspace".to_string();
        }
    }

    "system".to_string()
}

fn default_scan_roots() -> Vec<String> {
    let mut roots = Vec::new();
    let home_directories = SkillClassificationService::new().effective_scan_root_home_directories();

    if let Ok(current_dir) = std::env::current_dir() {
        extend_local_provider_roots_from_ancestors(&mut roots, &current_dir, &home_directories);
    }

    for home_dir in provider_home_dirs() {
        extend_provider_roots_for_home(&mut roots, &home_dir, &home_directories);
    }

    for env_key in PROVIDER_SCAN_ROOT_ENV_KEYS {
        if let Ok(value) = std::env::var(env_key) {
            roots.push(value);
        }
    }

    roots.extend(SkillClassificationService::new().effective_custom_scan_roots());

    extend_os_scan_roots(&mut roots);

    roots
}

fn default_watch_roots() -> Vec<String> {
    let mut roots = Vec::new();
    let home_directories = SkillClassificationService::new().effective_scan_root_home_directories();

    if let Ok(current_dir) = std::env::current_dir() {
        extend_local_provider_roots_from_ancestors(&mut roots, &current_dir, &home_directories);
    }

    for home_dir in provider_home_dirs() {
        extend_provider_roots_for_home(&mut roots, &home_dir, &home_directories);
    }

    for env_key in PROVIDER_WATCH_ROOT_ENV_KEYS {
        if let Ok(value) = std::env::var(env_key) {
            roots.push(value);
        }
    }

    roots.extend(SkillClassificationService::new().effective_custom_scan_roots());

    roots
}

fn extend_local_provider_roots_from_ancestors(
    roots: &mut Vec<String>,
    start_dir: &Path,
    home_directories: &[String],
) {
    for base_dir in start_dir.ancestors() {
        extend_local_provider_roots(roots, base_dir, home_directories);
    }
}

fn provider_home_dirs() -> Vec<PathBuf> {
    let mut homes = Vec::new();
    let mut seen = HashSet::new();

    if let Some(home_dir) = dirs::home_dir() {
        register_unique_path(&mut homes, &mut seen, home_dir);
    }

    for env_key in ["USERPROFILE", "HOME"] {
        if let Ok(value) = std::env::var(env_key) {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                continue;
            }

            register_unique_path(&mut homes, &mut seen, PathBuf::from(trimmed));
        }
    }

    if let (Ok(home_drive), Ok(home_path)) = (std::env::var("HOMEDRIVE"), std::env::var("HOMEPATH"))
    {
        let drive = home_drive.trim();
        let path = home_path.trim();

        if !drive.is_empty() && !path.is_empty() {
            register_unique_path(
                &mut homes,
                &mut seen,
                PathBuf::from(format!("{drive}{path}")),
            );
        }
    }

    for home_dir in discover_wsl_home_dirs() {
        register_unique_path(&mut homes, &mut seen, home_dir);
    }

    homes
}

fn register_unique_path(paths: &mut Vec<PathBuf>, seen: &mut HashSet<String>, candidate: PathBuf) {
    let key = candidate
        .to_string_lossy()
        .replace('\\', "/")
        .to_ascii_lowercase();
    if seen.insert(key) {
        paths.push(candidate);
    }
}

fn discover_wsl_home_dirs() -> Vec<PathBuf> {
    let mut homes = Vec::new();

    #[cfg(target_os = "windows")]
    for root in [Path::new(r"\\wsl$"), Path::new(r"\\wsl.localhost")] {
        homes.extend(discover_wsl_home_dirs_from_root(root));
    }

    homes
}

fn discover_wsl_home_dirs_from_root(wsl_root: &Path) -> Vec<PathBuf> {
    let mut homes = Vec::new();
    let mut seen = HashSet::new();

    let Ok(distributions) = fs::read_dir(wsl_root) else {
        return homes;
    };

    for distribution in distributions.flatten() {
        let distribution_root = distribution.path();
        if !distribution_root.is_dir() {
            continue;
        }

        let user_home_root = distribution_root.join("home");
        if let Ok(user_homes) = fs::read_dir(&user_home_root) {
            for user_home in user_homes.flatten() {
                let path = user_home.path();
                if path.is_dir() {
                    register_unique_path(&mut homes, &mut seen, path);
                }
            }
        }

        let root_home = distribution_root.join("root");
        if root_home.is_dir() {
            register_unique_path(&mut homes, &mut seen, root_home);
        }
    }

    homes
}

fn extend_provider_roots_for_home(
    roots: &mut Vec<String>,
    home_dir: &Path,
    home_directories: &[String],
) {
    for relative_directory in home_directories {
        roots.push(
            home_dir
                .join(relative_directory)
                .to_string_lossy()
                .into_owned(),
        );
    }
}

fn extend_os_scan_roots(roots: &mut Vec<String>) {
    for root in discover_os_roots() {
        roots.push(root.to_string_lossy().into_owned());
    }
}

fn discover_os_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    let mut seen = HashSet::new();

    let mut register = |candidate: PathBuf| {
        if !candidate.exists() || !candidate.is_dir() {
            return;
        }

        let key = candidate.to_string_lossy().into_owned();
        if seen.insert(key) {
            roots.push(candidate);
        }
    };

    #[cfg(target_os = "windows")]
    {
        for drive_letter in b'A'..=b'Z' {
            let drive = format!("{}:\\", drive_letter as char);
            register(PathBuf::from(drive));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let mount_root = Path::new("/mnt");
        if let Ok(entries) = fs::read_dir(mount_root) {
            for entry in entries.flatten() {
                let path = entry.path();
                let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
                    continue;
                };

                if name.len() == 1
                    && name
                        .chars()
                        .all(|character| character.is_ascii_alphabetic())
                {
                    register(path);
                }
            }
        }
    }

    roots
}

fn extend_local_provider_roots(
    roots: &mut Vec<String>,
    base_dir: &Path,
    home_directories: &[String],
) {
    if base_dir.join(SKILL_MANIFEST_NAME).exists() {
        roots.push(base_dir.to_string_lossy().into_owned());
    }

    let local_relative_directories = home_directories
        .iter()
        .map(String::as_str)
        .chain(["skills"]);

    for relative_directory in local_relative_directories {
        let candidate = base_dir.join(relative_directory);
        if candidate.exists() {
            roots.push(candidate.to_string_lossy().into_owned());
        }
    }
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::{Path, PathBuf},
        time::{SystemTime, UNIX_EPOCH},
    };

    use crate::services::SkillClassificationService;

    use super::{
        build_scan_roots, build_skip_directory_names, discover_os_roots,
        discover_wsl_home_dirs_from_root, extend_local_provider_roots,
        extend_local_provider_roots_from_ancestors, extend_provider_roots_for_home,
        normalized_path_key, provider_home_dirs,
    };

    #[test]
    fn default_scan_roots_should_stay_scoped_to_workspace_and_provider_locations() {
        let roots = build_scan_roots(None)
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect::<Vec<_>>();

        if let Some(home_dir) = dirs::home_dir() {
            assert!(
                !roots.contains(&home_dir.to_string_lossy().into_owned()),
                "default scan roots should not include the entire home directory"
            );
        }

        #[cfg(not(target_os = "windows"))]
        {
            assert!(
                !roots.iter().any(|root| root == "/opt"
                    || root == "/usr/local/share"
                    || root == "/usr/share"),
                "default scan roots should not include broad global directories"
            );
        }
    }

    #[test]
    fn extend_local_provider_roots_scopes_current_dir_to_provider_locations() {
        let workspace = TestWorkspace::new("local_provider_roots");
        let direct_skill = workspace.path.join("SKILL.md");
        let local_agents = workspace.path.join(".agents").join("skills");
        let local_skills = workspace.path.join("skills");

        fs::create_dir_all(&local_agents).expect("should create local .agents directory");
        fs::create_dir_all(&local_skills).expect("should create local skills directory");
        fs::write(&direct_skill, "# Root Skill\nSummary\n").expect("should write root manifest");

        let mut roots = Vec::new();
        extend_local_provider_roots(
            &mut roots,
            &workspace.path,
            &SkillClassificationService::new().effective_scan_root_home_directories(),
        );

        let normalized_roots = roots
            .iter()
            .map(|root| normalized_path_key(Path::new(root)))
            .collect::<Vec<_>>();

        assert!(normalized_roots.contains(&normalized_path_key(&workspace.path)));
        assert!(normalized_roots.contains(&normalized_path_key(&local_agents)));
        assert!(normalized_roots.contains(&normalized_path_key(&local_skills)));
    }

    #[test]
    fn extend_local_provider_roots_from_ancestors_discovers_project_level_skill_dirs() {
        let workspace = TestWorkspace::new("ancestor_provider_roots");
        let project_root = workspace.path.join("project");
        let nested_runtime_dir = project_root.join("src-tauri").join("target");
        let project_agents = project_root.join(".agents").join("skills");

        fs::create_dir_all(&nested_runtime_dir).expect("should create nested runtime directory");
        fs::create_dir_all(&project_agents)
            .expect("should create project .agents/skills directory");

        let mut roots = Vec::new();
        extend_local_provider_roots_from_ancestors(
            &mut roots,
            &nested_runtime_dir,
            &SkillClassificationService::new().effective_scan_root_home_directories(),
        );

        assert!(roots.iter().any(|root| {
            normalized_path_key(Path::new(root)) == normalized_path_key(&project_agents)
        }));
    }

    #[test]
    fn provider_home_dirs_includes_userprofile_when_present() {
        let Ok(user_profile) = std::env::var("USERPROFILE") else {
            return;
        };

        let expected = PathBuf::from(user_profile);
        let homes = provider_home_dirs();

        assert!(
            homes.iter().any(|candidate| candidate == &expected),
            "provider home directories should include USERPROFILE when it is present",
        );
    }

    #[test]
    fn extend_provider_roots_for_home_includes_windows_appdata_roots() {
        let mut roots = Vec::new();
        let fake_home = PathBuf::from("/tmp/skills_ide_windows_home");

        extend_provider_roots_for_home(
            &mut roots,
            &fake_home,
            &SkillClassificationService::new().effective_scan_root_home_directories(),
        );

        assert!(roots.iter().any(|root| {
            root.ends_with("AppData/Roaming/codex/skills")
                || root.ends_with("AppData\\Roaming\\codex\\skills")
        }));
        assert!(roots.iter().any(|root| {
            root.ends_with("AppData/Local/codex/skills")
                || root.ends_with("AppData\\Local\\codex\\skills")
        }));
    }

    #[test]
    fn discover_wsl_home_dirs_from_root_finds_distribution_homes() {
        let workspace = TestWorkspace::new("wsl_homes");
        let ubuntu_home = workspace.path.join("Ubuntu").join("home").join("abram");
        let debian_root = workspace.path.join("Debian").join("root");

        fs::create_dir_all(&ubuntu_home).expect("should create ubuntu home");
        fs::create_dir_all(&debian_root).expect("should create debian root home");

        let homes = discover_wsl_home_dirs_from_root(&workspace.path);
        let normalized_homes = homes
            .iter()
            .map(|path| normalized_path_key(path))
            .collect::<Vec<_>>();

        assert!(normalized_homes.contains(&normalized_path_key(&ubuntu_home)));
        assert!(normalized_homes.contains(&normalized_path_key(&debian_root)));
    }

    #[test]
    fn discover_os_roots_includes_mounted_windows_drives_when_present() {
        let roots = discover_os_roots();
        if Path::new("/mnt/c").exists() {
            assert!(
                roots.iter().any(|root| root == Path::new("/mnt/c")),
                "expected /mnt/c to be included when present"
            );
        }
    }

    #[test]
    fn default_watch_roots_does_not_include_broad_os_roots() {
        let roots = super::build_watch_roots(None);

        #[cfg(not(target_os = "windows"))]
        if Path::new("/mnt/c").exists() {
            assert!(
                !roots.iter().any(|root| root == Path::new("/mnt/c")),
                "watch roots should avoid broad OS roots to prevent endless refresh loops",
            );
        }
    }

    #[test]
    fn classify_source_detects_managed_paths_with_windows_separators() {
        let source = super::classify_source(Path::new(r"C:\Users\abram\.codex\skills\cpp-lint"));
        assert_eq!(source, "managed");
    }

    #[test]
    fn normalized_path_key_normalizes_case_and_separators() {
        let normalized = normalized_path_key(Path::new(r"C:\Users\Abram\.Codex\skills\Cpp-Lint\"));
        assert_eq!(normalized, "c:/users/abram/.codex/skills/cpp-lint");
    }

    #[test]
    fn build_skip_directory_names_includes_default_hidden_directories() {
        let skip_names = build_skip_directory_names();
        assert!(skip_names.contains("node_modules"));
        assert!(skip_names.contains(".cache"));
    }

    struct TestWorkspace {
        path: PathBuf,
    }

    impl TestWorkspace {
        fn new(prefix: &str) -> Self {
            let unique_suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system time should be after unix epoch")
                .as_nanos();
            let path = std::env::temp_dir().join(format!("skills_ide_{prefix}_{unique_suffix}"));

            fs::create_dir_all(&path).expect("should create temporary workspace");

            Self { path }
        }
    }

    impl Drop for TestWorkspace {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }
}
