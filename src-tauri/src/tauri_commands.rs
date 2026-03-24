use crate::{
    models::{SkillScanResponse, SystemSkillContentResponse},
    services::SkillService,
};

#[tauri::command]
pub fn scan_system_skills(scan_roots: Option<Vec<String>>) -> Result<SkillScanResponse, String> {
    SkillService::new().scan(scan_roots)
}

#[tauri::command]
pub fn load_system_skill(root_path: String) -> Result<SystemSkillContentResponse, String> {
    SkillService::new().load_from_root(root_path)
}
