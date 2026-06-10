use std::{
    sync::mpsc::{self, Receiver, TryRecvError},
    thread,
};

use skills_core::{SkillScanResponse, SkillService, SystemSkill, SystemSkillTreeFile};

use crate::roots::{optional_roots, parse_roots};

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum InputMode {
    Normal,
    Search,
    Roots,
}

pub(crate) struct App {
    pub(crate) roots: Vec<String>,
    pub(crate) scanned_roots: Vec<String>,
    pub(crate) skills: Vec<SystemSkill>,
    pub(crate) filtered_skills: Vec<usize>,
    pub(crate) files: Vec<SystemSkillTreeFile>,
    pub(crate) selected: usize,
    pub(crate) search: String,
    pub(crate) root_input: String,
    pub(crate) mode: InputMode,
    pub(crate) status: String,
    scan_receiver: Option<Receiver<Result<SkillScanResponse, String>>>,
    pending_selected_root_path: Option<String>,
}

impl App {
    pub(crate) fn new(roots: Vec<String>) -> Self {
        let root_input = roots.join("; ");

        Self {
            roots,
            scanned_roots: Vec::new(),
            skills: Vec::new(),
            filtered_skills: Vec::new(),
            files: Vec::new(),
            selected: 0,
            search: String::new(),
            root_input,
            mode: InputMode::Normal,
            status: "Loading skills...".to_string(),
            scan_receiver: None,
            pending_selected_root_path: None,
        }
    }

    pub(crate) fn refresh(&mut self) {
        let roots = self.roots.clone();
        let (sender, receiver) = mpsc::channel();

        self.pending_selected_root_path =
            self.selected_skill().map(|skill| skill.root_path.clone());
        self.scan_receiver = Some(receiver);
        self.status = if roots.is_empty() {
            "Scanning all default OS directories...".to_string()
        } else {
            format!("Scanning {} custom directories...", roots.len())
        };

        thread::spawn(move || {
            let result = SkillService::new().scan(optional_roots(roots));
            let _ = sender.send(result);
        });
    }

    pub(crate) fn poll_scan(&mut self) {
        let Some(receiver) = &self.scan_receiver else {
            return;
        };

        let scan_result = match receiver.try_recv() {
            Ok(result) => Some(result),
            Err(TryRecvError::Empty) => None,
            Err(TryRecvError::Disconnected) => {
                Some(Err("Scan worker stopped before finishing".to_string()))
            }
        };

        if let Some(result) = scan_result {
            self.scan_receiver = None;
            self.finish_refresh(result);
        }
    }

    pub(crate) fn select_next(&mut self) {
        if self.filtered_skills.is_empty() {
            return;
        }

        self.selected = (self.selected + 1).min(self.filtered_skills.len() - 1);
        self.load_selected_files();
    }

    pub(crate) fn select_previous(&mut self) {
        if self.filtered_skills.is_empty() {
            return;
        }

        self.selected = self.selected.saturating_sub(1);
        self.load_selected_files();
    }

    pub(crate) fn page_down(&mut self) {
        self.move_selection(10);
    }

    pub(crate) fn page_up(&mut self) {
        self.move_selection(-10);
    }

    pub(crate) fn select_first(&mut self) {
        if self.filtered_skills.is_empty() {
            return;
        }

        self.selected = 0;
        self.load_selected_files();
    }

    pub(crate) fn select_last(&mut self) {
        if self.filtered_skills.is_empty() {
            return;
        }

        self.selected = self.filtered_skills.len() - 1;
        self.load_selected_files();
    }

    pub(crate) fn enter_search(&mut self) {
        self.mode = InputMode::Search;
    }

    pub(crate) fn enter_roots(&mut self) {
        self.root_input = self.roots.join("; ");
        self.mode = InputMode::Roots;
    }

    pub(crate) fn exit_input(&mut self) {
        self.mode = InputMode::Normal;
    }

    pub(crate) fn push_search_char(&mut self, character: char) {
        self.search.push(character);
        self.apply_search_change();
    }

    pub(crate) fn pop_search_char(&mut self) {
        self.search.pop();
        self.apply_search_change();
    }

    pub(crate) fn clear_search(&mut self) {
        self.search.clear();
        self.apply_search_change();
    }

    pub(crate) fn push_root_char(&mut self, character: char) {
        self.root_input.push(character);
    }

    pub(crate) fn pop_root_char(&mut self) {
        self.root_input.pop();
    }

    pub(crate) fn apply_roots(&mut self) {
        self.roots = parse_roots(&self.root_input);
        self.mode = InputMode::Normal;
        self.status = if self.roots.is_empty() {
            "Using all default OS directories".to_string()
        } else {
            format!("Using {} scan directories", self.roots.len())
        };
        self.refresh();
    }

    pub(crate) fn selected_skill(&self) -> Option<&SystemSkill> {
        let skill_index = self.filtered_skills.get(self.selected)?;
        self.skills.get(*skill_index)
    }

    fn finish_refresh(&mut self, result: Result<SkillScanResponse, String>) {
        match result {
            Ok(response) => {
                self.skills = response.skills;
                self.scanned_roots = response.scanned_roots;
                self.rebuild_filter();
                let previous_root_path = self.pending_selected_root_path.take();
                self.restore_selection(previous_root_path);
                self.status = format!(
                    "{} skills found in {} ms",
                    self.filtered_skills.len(),
                    response.duration_ms
                );
                self.load_selected_files();
            }
            Err(error) => {
                self.skills.clear();
                self.filtered_skills.clear();
                self.files.clear();
                self.scanned_roots.clear();
                self.selected = 0;
                self.status = format!("Error: {error}");
            }
        }
    }

    fn load_selected_files(&mut self) {
        let Some(root_path) = self.selected_skill().map(|skill| skill.root_path.clone()) else {
            self.files.clear();
            return;
        };

        match SkillService::new().list_from_root(root_path) {
            Ok(files) => self.files = files,
            Err(error) => {
                self.files.clear();
                self.status = format!("Error: {error}");
            }
        }
    }

    fn rebuild_filter(&mut self) {
        let query = self.search.trim().to_ascii_lowercase();

        self.filtered_skills = self
            .skills
            .iter()
            .enumerate()
            .filter_map(|(index, skill)| {
                if query.is_empty() || skill_matches(skill, &query) {
                    Some(index)
                } else {
                    None
                }
            })
            .collect();

        if self.selected >= self.filtered_skills.len() {
            self.selected = self.filtered_skills.len().saturating_sub(1);
        }
    }

    fn apply_search_change(&mut self) {
        self.selected = 0;
        self.rebuild_filter();
        self.status = if self.search.trim().is_empty() {
            format!("Showing all {} skills", self.skills.len())
        } else {
            format!(
                "{} of {} skills match '{}'.",
                self.filtered_skills.len(),
                self.skills.len(),
                self.search
            )
        };
        self.load_selected_files();
    }

    fn restore_selection(&mut self, previous_root_path: Option<String>) {
        if let Some(previous_root_path) = previous_root_path {
            if let Some(index) = self.filtered_skills.iter().position(|skill_index| {
                self.skills
                    .get(*skill_index)
                    .map(|skill| skill.root_path == previous_root_path)
                    .unwrap_or(false)
            }) {
                self.selected = index;
                return;
            }
        }

        if self.selected >= self.filtered_skills.len() {
            self.selected = self.filtered_skills.len().saturating_sub(1);
        }
    }

    fn move_selection(&mut self, offset: isize) {
        if self.filtered_skills.is_empty() {
            return;
        }

        let last_index = self.filtered_skills.len() - 1;
        let next = self.selected.saturating_add_signed(offset).min(last_index);

        if self.selected != next {
            self.selected = next;
            self.load_selected_files();
        }
    }
}

fn skill_matches(skill: &SystemSkill, query: &str) -> bool {
    skill.name.to_ascii_lowercase().contains(query)
        || skill.summary.to_ascii_lowercase().contains(query)
        || skill.source.to_ascii_lowercase().contains(query)
        || skill.root_path.to_ascii_lowercase().contains(query)
}
