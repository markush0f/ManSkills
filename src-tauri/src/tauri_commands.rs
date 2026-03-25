use crate::{
    models::{SkillScanResponse, SkillTreeResponse, SystemSkillContentResponse},
    services::SkillService,
};

#[tauri::command]
pub fn scan_system_skills(scan_roots: Option<Vec<String>>) -> Result<SkillScanResponse, String> {
    SkillService::new().scan(scan_roots)
}

#[tauri::command]
pub fn scan_system_skills_tree(
    scan_roots: Option<Vec<String>>,
) -> Result<SkillTreeResponse, String> {
    SkillService::new().scan_tree(scan_roots)
}

#[tauri::command]
pub fn load_system_skill(root_path: String) -> Result<SystemSkillContentResponse, String> {
    SkillService::new().load_from_root(root_path)
}

#[tauri::command]
pub fn save_system_skill_file(
    root_path: String,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    SkillService::new().save_file(root_path, relative_path, content)
}
