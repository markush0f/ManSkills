use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

use ide_lib::services::SkillService;

#[test]
fn save_file_updates_existing_file_within_skill_root() {
    let workspace = TestWorkspace::new("save_existing_file");
    let skill_root = workspace.path.join("editable-skill");
    let file_path = skill_root.join("SKILL.md");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(&file_path, "# Editable Skill\nInitial content\n").expect("should write manifest");

    SkillService::new()
        .save_file(
            skill_root.to_string_lossy(),
            "SKILL.md",
            "# Editable Skill\nUpdated content\n",
        )
        .expect("save should succeed");

    let saved_content = fs::read_to_string(file_path).expect("should read updated file");
    assert_eq!(saved_content, "# Editable Skill\nUpdated content\n");
}

#[test]
fn save_file_returns_error_when_relative_path_escapes_skill_root() {
    let workspace = TestWorkspace::new("save_escape");
    let skill_root = workspace.path.join("escape-skill");
    let external_file = workspace.path.join("outside.md");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(skill_root.join("SKILL.md"), "# Escape Skill\n").expect("should write manifest");
    fs::write(&external_file, "outside\n").expect("should write external file");

    let error = SkillService::new()
        .save_file(
            skill_root.to_string_lossy(),
            "../outside.md",
            "updated outside content\n",
        )
        .expect_err("save should fail when path escapes root");

    assert_eq!(error, "Skill file path escapes the skill root");
}

#[test]
fn save_file_returns_error_when_target_file_does_not_exist() {
    let workspace = TestWorkspace::new("save_missing");
    let skill_root = workspace.path.join("missing-file-skill");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(skill_root.join("SKILL.md"), "# Missing File Skill\n")
        .expect("should write manifest");

    let error = SkillService::new()
        .save_file(
            skill_root.to_string_lossy(),
            "missing.json",
            "{ \"updated\": true }\n",
        )
        .expect_err("save should fail for a missing file");

    assert_eq!(error, "Skill file does not exist");
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
