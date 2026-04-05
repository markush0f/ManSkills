use std::{
    collections::BTreeSet,
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self, RecvTimeoutError},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::Duration,
};

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter, Manager};

use crate::{
    models::SkillWatchEvent,
    services::{
        support::{build_watch_roots, normalize_relative_path, SKILL_MANIFEST_NAME},
        BackendLogService,
    },
};

const DEFAULT_WATCH_DEBOUNCE: Duration = Duration::from_millis(400);
const WATCH_POLL_INTERVAL: Duration = Duration::from_millis(100);
const SKILLS_CHANGED_EVENT: &str = "skills:changed";

pub struct SkillWatchService {
    stop_signal: Arc<AtomicBool>,
    event_thread: Option<JoinHandle<()>>,
    watcher: Option<RecommendedWatcher>,
}

impl SkillWatchService {
    pub fn start_for_app(
        app_handle: AppHandle,
        scan_roots: Option<Vec<String>>,
    ) -> Result<Self, String> {
        let emitter = move |event: SkillWatchEvent| {
            let _ = app_handle.emit(SKILLS_CHANGED_EVENT, event);
        };

        Self::start_with_notifier(scan_roots, DEFAULT_WATCH_DEBOUNCE, emitter)
    }

    pub fn start_with_notifier<F>(
        scan_roots: Option<Vec<String>>,
        debounce: Duration,
        notifier: F,
    ) -> Result<Self, String>
    where
        F: Fn(SkillWatchEvent) + Send + Sync + 'static,
    {
        let roots = build_watch_roots(scan_roots);
        BackendLogService::shared().info(format!(
            "skill watcher starting with roots={:?}",
            roots
                .iter()
                .map(|path| path.to_string_lossy().into_owned())
                .collect::<Vec<_>>()
        ));
        if roots.is_empty() {
            BackendLogService::shared()
                .warn("skill watcher skipped because no watch roots were found");
            return Ok(Self {
                stop_signal: Arc::new(AtomicBool::new(false)),
                event_thread: None,
                watcher: None,
            });
        }

        let (sender, receiver) = mpsc::channel();
        let mut watcher = RecommendedWatcher::new(
            move |event| {
                let _ = sender.send(event);
            },
            Config::default(),
        )
        .map_err(|error| format!("could not create skills watcher: {error}"))?;

        for root in &roots {
            watcher
                .watch(root, RecursiveMode::Recursive)
                .map_err(|error| format!("could not watch `{}`: {error}", root.display()))?;
        }

        let stop_signal = Arc::new(AtomicBool::new(false));
        let thread_stop_signal = Arc::clone(&stop_signal);
        let notifier = Arc::new(notifier);
        let event_thread = thread::spawn(move || {
            watch_event_loop(receiver, debounce, thread_stop_signal, notifier);
        });

        Ok(Self {
            stop_signal,
            event_thread: Some(event_thread),
            watcher: Some(watcher),
        })
    }
}

impl Drop for SkillWatchService {
    fn drop(&mut self) {
        self.stop_signal.store(true, Ordering::Relaxed);
        let _ = self.watcher.take();

        if let Some(event_thread) = self.event_thread.take() {
            let _ = event_thread.join();
        }
    }
}

pub struct SkillWatchState {
    _service: Mutex<SkillWatchService>,
}

impl SkillWatchState {
    pub fn install(app_handle: &AppHandle) -> Result<(), String> {
        let service = SkillWatchService::start_for_app(app_handle.clone(), None)?;
        app_handle.manage(Self {
            _service: Mutex::new(service),
        });
        Ok(())
    }
}

fn watch_event_loop(
    receiver: mpsc::Receiver<notify::Result<Event>>,
    debounce: Duration,
    stop_signal: Arc<AtomicBool>,
    notifier: Arc<dyn Fn(SkillWatchEvent) + Send + Sync>,
) {
    while !stop_signal.load(Ordering::Relaxed) {
        let Ok(event_result) = receiver.recv_timeout(WATCH_POLL_INTERVAL) else {
            continue;
        };

        let mut changed_paths = collect_relevant_paths(event_result);
        if changed_paths.is_empty() {
            continue;
        }

        loop {
            match receiver.recv_timeout(debounce) {
                Ok(event_result) => {
                    changed_paths.extend(collect_relevant_paths(event_result));
                }
                Err(RecvTimeoutError::Timeout) => {
                    let event = SkillWatchEvent {
                        paths: changed_paths.into_iter().collect(),
                    };
                    BackendLogService::shared().info(format!(
                        "skill watcher emitted changed event paths={:?}",
                        event.paths
                    ));
                    notifier(event);
                    break;
                }
                Err(RecvTimeoutError::Disconnected) => return,
            }
        }
    }
}

fn collect_relevant_paths(event_result: notify::Result<Event>) -> BTreeSet<String> {
    let Ok(event) = event_result else {
        return BTreeSet::new();
    };

    if !is_relevant_event_kind(&event.kind) {
        return BTreeSet::new();
    }

    event
        .paths
        .into_iter()
        .filter(|path| is_relevant_skill_change(path))
        .map(|path| normalize_relative_path(&path))
        .collect()
}

fn is_relevant_event_kind(kind: &EventKind) -> bool {
    matches!(
        kind,
        EventKind::Any
            | EventKind::Other
            | EventKind::Create(_)
            | EventKind::Modify(_)
            | EventKind::Remove(_)
    )
}

fn is_relevant_skill_change(path: &Path) -> bool {
    if path
        .file_name()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case(SKILL_MANIFEST_NAME))
        .unwrap_or(false)
    {
        return true;
    }

    path.components().any(|component| {
        component
            .as_os_str()
            .to_str()
            .map(|value| value.eq_ignore_ascii_case("skills"))
            .unwrap_or(false)
    })
}
