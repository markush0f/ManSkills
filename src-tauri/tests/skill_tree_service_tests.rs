use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use ide_lib::services::SkillService;

#[test]
fn scan_tree_builds_directory_hierarchy_for_skills() {
    let workspace = TestWorkspace::new("tree_hierarchy");
    let nested_skill_root = workspace.path.join(Path::new("group/backend/My Skill"));

    fs::create_dir_all(&nested_skill_root).expect("should create nested skill directory");
    fs::write(
        nested_skill_root.join("SKILL.md"),
        "# My Skill\nNested summary\n",
    )
    .expect("should write nested manifest");

    let response = SkillService::new()
        .scan_tree(Some(vec![workspace.path_string()]))
        .expect("tree scan should succeed");

    assert_eq!(response.roots.len(), 1);

    let root = &response.roots[0];
    assert_eq!(root.kind, "root");
    assert_eq!(root.path, workspace.path_string());

    let group_node = root
        .children
        .iter()
        .find(|node| node.kind == "directory" && node.name == "group")
        .expect("expected group directory");
    let backend_node = group_node
        .children
        .iter()
        .find(|node| node.kind == "directory" && node.name == "backend")
        .expect("expected backend directory");
    let skill_node = backend_node
        .children
        .iter()
        .find(|node| node.kind == "skill" && node.name == "My Skill")
        .expect("expected skill leaf");

    assert_eq!(skill_node.path, nested_skill_root.to_string_lossy());
    assert_eq!(
        skill_node
            .skill
            .as_ref()
            .expect("skill metadata should exist")
            .summary,
        "Nested summary"
    );
}

#[test]
fn scan_tree_uses_longest_matching_scan_root() {
    let workspace = TestWorkspace::new("tree_roots");
    let parent_root = workspace.path.join("parent");
    let child_root = parent_root.join("child");
    let skill_root = child_root.join("Tree Skill");

    fs::create_dir_all(&skill_root).expect("should create skill directory");
    fs::write(
        skill_root.join("SKILL.md"),
        "# Tree Skill\nSummary for tree\n",
    )
    .expect("should write manifest");

    let response = SkillService::new()
        .scan_tree(Some(vec![
            parent_root.to_string_lossy().into_owned(),
            child_root.to_string_lossy().into_owned(),
        ]))
        .expect("tree scan should succeed");

    assert_eq!(response.roots.len(), 1);
    assert_eq!(response.roots[0].path, child_root.to_string_lossy());

    let skill_node = response.roots[0]
        .children
        .iter()
        .find(|node| node.kind == "skill" && node.name == "Tree Skill")
        .expect("expected skill under deepest root");

    assert_eq!(
        skill_node
            .skill
            .as_ref()
            .expect("skill metadata should exist")
            .slug,
        "tree-skill"
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
