use crate::{
    models::{
        MarketplaceInstallResult, MarketplaceSearchResponse, MarketplaceSkill, SkillScanResponse, SkillTreeResponse,
        SystemSkillContentResponse, SystemSkillTreeFile,
    },
    services::{MarketplaceService, SkillService},
};

#[tauri::command]
pub fn search_marketplace_skills(
    query: Option<String>,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<MarketplaceSearchResponse, String> {
    MarketplaceService::new().search(query, page, limit)
}

#[tauri::command]
pub fn install_marketplace_skill(
    skill: MarketplaceSkill,
    target: String,
) -> Result<MarketplaceInstallResult, String> {
    MarketplaceService::new().install(skill, target)
}

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
pub fn list_system_skill_files(root_path: String) -> Result<Vec<SystemSkillTreeFile>, String> {
    SkillService::new().list_from_root(root_path)
}

#[tauri::command]
pub fn save_system_skill_file(
    root_path: String,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    SkillService::new().save_file(root_path, relative_path, content)
}
