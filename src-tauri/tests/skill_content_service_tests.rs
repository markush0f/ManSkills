use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

use ide_lib::services::SkillService;

#[test]
fn list_from_root_should_return_skill_files_without_content_and_with_manifest_first() {
    let workspace = TestWorkspace::new("list_files");
    let skill_root = workspace.path.join("listable-skill");

    fs::create_dir_all(skill_root.join("docs")).expect("should create skill directory");
    fs::write(
        skill_root.join("config.json"),
        "{\n  \"name\": \"listable\"\n}\n",
    )
    .expect("should write config file");
    fs::write(skill_root.join("SKILL.md"), "# Listable Skill\nSummary\n")
        .expect("should write manifest");
    fs::write(skill_root.join("docs").join("notes.md"), "Hello\n")
        .expect("should write nested file");

    let files = SkillService::new()
        .list_from_root(skill_root.to_string_lossy())
        .expect("file listing should succeed");

    let relative_paths = files
        .iter()
        .map(|file| file.relative_path.as_str())
        .collect::<Vec<_>>();

    assert_eq!(relative_paths[0], "SKILL.md");
    assert_eq!(
        relative_paths,
        vec!["SKILL.md", "config.json", "docs/notes.md"]
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
}

impl Drop for TestWorkspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}
