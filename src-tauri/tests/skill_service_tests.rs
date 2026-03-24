use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

use ide_lib::services::SkillService;

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
        .find(|skill| skill.root_path == skill_root.to_string_lossy())
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
        .find(|skill| skill.root_path == skill_root.to_string_lossy())
        .expect("expected scanned skill");

    assert_eq!(skill.summary, "Short summary line");
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
