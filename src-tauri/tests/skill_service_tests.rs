use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use ide_lib::services::SkillService;
use serde_json::json;

#[test]
fn scan_normalizes_skill_slug_from_directory_name() {
    let workspace = TestWorkspace::new("scan_slug");
    let skill_root = workspace.path.join("My Skill");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(
        skill_root.join("SKILL.md"),
        "# My Skill\nShort summary line\n",
    )
    .expect("should write manifest");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    let skill = response
        .skills
        .iter()
        .find(|skill| normalized_path_key(Path::new(&skill.root_path)) == normalized_path_key(&skill_root))
        .expect("expected scanned skill");

    assert_eq!(skill.slug, "my-skill");
}

#[test]
fn scan_uses_first_plain_text_line_as_summary() {
    let workspace = TestWorkspace::new("scan_summary");
    let skill_root = workspace.path.join("summary-skill");
    let manifest = "# Summary Skill\n- bullet\nShort summary line\n";

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(skill_root.join("SKILL.md"), manifest).expect("should write manifest");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    let skill = response
        .skills
        .iter()
        .find(|skill| normalized_path_key(Path::new(&skill.root_path)) == normalized_path_key(&skill_root))
        .expect("expected scanned skill");

    assert_eq!(skill.summary, "Short summary line");
}

#[test]
fn scan_marks_supported_provider_skill_directories_as_managed() {
    let workspace = TestWorkspace::new("scan_managed_providers");
    let skill_roots = [
        workspace.path.join(".claude/skills/review-skill"),
        workspace.path.join(".cursor/skills/debug-skill"),
        workspace.path.join(".windsurf/skills/research-skill"),
        workspace.path.join(".gemini/skills/writer-skill"),
    ];

    for skill_root in &skill_roots {
        fs::create_dir_all(skill_root).expect("should create skill directory");
        fs::write(
            skill_root.join("SKILL.md"),
            "# Managed Skill\nSummary line\n",
        )
        .expect("should write manifest");
    }

    let scan_roots = skill_roots
        .iter()
        .filter_map(|skill_root| skill_root.parent())
        .map(|path| path.to_string_lossy().into_owned())
        .collect::<Vec<_>>();

    let response = SkillService::new()
        .scan(Some(scan_roots))
        .expect("scan should succeed");

    for skill_root in &skill_roots {
        let skill = response
            .skills
            .iter()
            .find(|skill| normalized_path_key(Path::new(&skill.root_path)) == normalized_path_key(skill_root))
            .expect("expected scanned skill");

        assert_eq!(skill.source, "managed");
    }
}

#[test]
fn scan_surfaces_marketplace_install_metadata_when_present() {
    let workspace = TestWorkspace::new("scan_marketplace_metadata");
    let skill_root = workspace.path.join("marketplace-skill");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(
        skill_root.join("SKILL.md"),
        "# Marketplace Skill\nSummary line\n",
    )
    .expect("should write manifest");
    fs::write(
        skill_root.join(".skills-ide-marketplace.json"),
        serde_json::to_string_pretty(&json!({
            "skillId": "skill_123",
            "slug": "marketplace-skill",
            "name": "Marketplace Skill",
            "githubUrl": "https://github.com/example/repo/tree/main/skills/marketplace-skill",
            "skillUrl": "https://skillsmp.com/skills/example",
            "remoteUpdatedAt": "1712345678",
            "installTarget": "workspace",
            "installCollection": "team/tools",
            "installedAt": "1712000000",
            "installedPath": skill_root.to_string_lossy(),
            "installer": "skills-ide"
        }))
        .expect("metadata json should serialize"),
    )
    .expect("should write marketplace metadata");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    let skill = response
        .skills
        .iter()
        .find(|skill| normalized_path_key(Path::new(&skill.root_path)) == normalized_path_key(&skill_root))
        .expect("expected scanned skill");

    let metadata = skill
        .marketplace_install
        .as_ref()
        .expect("expected marketplace metadata");

    assert_eq!(metadata.skill_id.as_deref(), Some("skill_123"));
    assert_eq!(metadata.install_target.as_deref(), Some("workspace"));
    assert_eq!(metadata.install_collection.as_deref(), Some("team/tools"));
    assert_eq!(metadata.installed_path, skill_root.to_string_lossy());
}

#[test]
fn scan_ignores_skill_directories_without_manifest_under_agents_or_skills() {
    let workspace = TestWorkspace::new("scan_ignore_dirs_without_manifest");
    let directory_without_manifest = workspace.path.join("workspace").join("agents").join("ops-tooling");

    fs::create_dir_all(&directory_without_manifest).expect("should create inferred skill directory");
    fs::write(
        directory_without_manifest.join("notes.md"),
        "directory without manifest\n",
    )
    .expect("should write inferred skill file");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    assert!(
        response
            .skills
            .iter()
            .all(|skill| {
                normalized_path_key(Path::new(&skill.root_path))
                    != normalized_path_key(&directory_without_manifest)
            }),
        "directory without SKILL.md should not be scanned",
    );
}

#[test]
fn scan_ignores_agents_or_skills_container_directories_without_manifest() {
    let workspace = TestWorkspace::new("scan_ignore_container_without_manifest");
    let skills_container = workspace.path.join("company").join("skills");

    fs::create_dir_all(skills_container.join("guides")).expect("should create skills container");
    fs::write(
        skills_container.join("guides").join("readme.md"),
        "container content\n",
    )
    .expect("should write container file");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    assert!(
        response
            .skills
            .iter()
            .all(|skill| normalized_path_key(Path::new(&skill.root_path)) != normalized_path_key(&skills_container)),
        "skills container without SKILL.md should not be scanned",
    );
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

    fn path_string(&self) -> String {
        self.path.to_string_lossy().into_owned()
    }
}

impl Drop for TestWorkspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

#[test]
fn scan_reports_git_repository_root_for_skills_inside_git_repos() {
    let workspace = TestWorkspace::new("scan_git_repo");
    let project_root = workspace.path.join("my-project");
    let skill_root = project_root.join(".agents").join("skills").join("my-skill");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(
        skill_root.join("SKILL.md"),
        "# My Skill\nSummary line\n",
    )
    .expect("should write manifest");
    fs::create_dir_all(project_root.join(".git")).expect("should create .git directory");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    let skill = response
        .skills
        .iter()
        .find(|skill| normalized_path_key(Path::new(&skill.root_path)) == normalized_path_key(&skill_root))
        .expect("expected scanned skill");

    assert_eq!(
        normalized_path_key(Path::new(skill.git_repository_root_path.as_ref().unwrap())),
        normalized_path_key(&project_root),
        "skill inside a git repo should have git_repository_root_path set"
    );
}

#[test]
fn scan_reports_no_git_repository_root_for_skills_outside_git_repos() {
    let workspace = TestWorkspace::new("scan_no_git");
    let skill_root = workspace.path.join("standalone-skill");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(
        skill_root.join("SKILL.md"),
        "# Standalone Skill\nSummary\n",
    )
    .expect("should write manifest");

    let response = SkillService::new()
        .scan(Some(vec![workspace.path_string()]))
        .expect("scan should succeed");

    let skill = response
        .skills
        .iter()
        .find(|skill| normalized_path_key(Path::new(&skill.root_path)) == normalized_path_key(&skill_root))
        .expect("expected scanned skill");

    assert_eq!(
        skill.git_repository_root_path.as_ref(),
        None,
        "skill outside a git repo should have git_repository_root_path as None"
    );
}

fn normalized_path_key(path: &Path) -> String {
    let mut normalized = path.to_string_lossy().replace('\\', "/").to_ascii_lowercase();

    if let Some(stripped) = normalized.strip_prefix("//?/") {
        normalized = stripped.to_string();
    }

    while normalized.len() > 1 && normalized.ends_with('/') {
        normalized.pop();
    }

    normalized
}
