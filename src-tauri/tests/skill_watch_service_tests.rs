use std::{
    fs,
    path::PathBuf,
    sync::mpsc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use ide_lib::{models::SkillWatchEvent, services::SkillWatchService};

#[test]
fn watcher_should_emit_event_when_skill_manifest_is_created() {
    let workspace = TestWorkspace::new("watch_manifest_create");
    let skill_root = workspace.path.join(".claude/skills/explain-code");
    fs::create_dir_all(&skill_root).expect("should create skill directory");

    let (sender, receiver) = mpsc::channel::<SkillWatchEvent>();
    let _watch_service = SkillWatchService::start_with_notifier(
        Some(vec![workspace.path_string()]),
        Duration::from_millis(150),
        move |event| {
            let _ = sender.send(event);
        },
    )
    .expect("watch service should start");

    fs::write(skill_root.join("SKILL.md"), "# Explain Code\nSummary\n")
        .expect("should write manifest");

    let event = receiver
        .recv_timeout(Duration::from_secs(5))
        .expect("watcher should emit an event");

    assert!(
        event
            .paths
            .iter()
            .any(|path| path.ends_with("/.claude/skills/explain-code/SKILL.md")),
        "expected manifest path in watch event, got {:?}",
        event.paths
    );
}

#[test]
fn watcher_should_ignore_non_skill_changes() {
    let workspace = TestWorkspace::new("watch_irrelevant_change");
    let (sender, receiver) = mpsc::channel::<SkillWatchEvent>();
    let _watch_service = SkillWatchService::start_with_notifier(
        Some(vec![workspace.path_string()]),
        Duration::from_millis(150),
        move |event| {
            let _ = sender.send(event);
        },
    )
    .expect("watch service should start");

    fs::write(workspace.path.join("notes.txt"), "hello").expect("should write plain text file");

    let no_event = receiver.recv_timeout(Duration::from_millis(800));
    assert!(
        no_event.is_err(),
        "watcher should not emit event for irrelevant file change"
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
