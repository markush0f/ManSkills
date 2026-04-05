use crate::{
    models::{
        BackendLogSnapshot, MarketplaceInstallResult, MarketplaceSearchResponse, MarketplaceSkill,
        MarketplaceUninstallResult, SkillScanResponse, SkillTreeResponse,
        SystemSkillContentResponse, SystemSkillTreeFile,
    },
    services::{BackendLogService, MarketplaceService, SkillService},
};

#[tauri::command]
pub fn search_marketplace_skills(
    query: Option<String>,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<MarketplaceSearchResponse, String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "search_marketplace_skills query={:?} page={:?} limit={:?}",
        query, page, limit
    ));

    let result = MarketplaceService::new().search(query, page, limit);
    match &result {
        Ok(response) => logger.info(format!(
            "search_marketplace_skills success total={:?} page={}",
            response.total, response.page
        )),
        Err(error) => logger.error(format!("search_marketplace_skills failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn install_marketplace_skill(
    skill: MarketplaceSkill,
    target: String,
    collection: Option<String>,
) -> Result<MarketplaceInstallResult, String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "install_marketplace_skill slug={} target={} collection={:?}",
        skill.slug, target, collection
    ));

    let result = MarketplaceService::new().install(skill, target, collection);
    match &result {
        Ok(response) => logger.info(format!(
            "install_marketplace_skill success installed_path={}",
            response.installed_path
        )),
        Err(error) => logger.error(format!("install_marketplace_skill failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn load_marketplace_skill_manifest(skill: MarketplaceSkill) -> Result<String, String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "load_marketplace_skill_manifest slug={}",
        skill.slug
    ));

    let result = MarketplaceService::new().load_manifest(&skill);
    if let Err(error) = &result {
        logger.error(format!("load_marketplace_skill_manifest failed: {error}"));
    }

    result
}

#[tauri::command]
pub fn update_marketplace_skill(
    skill: MarketplaceSkill,
    root_path: String,
) -> Result<MarketplaceInstallResult, String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "update_marketplace_skill slug={} root_path={}",
        skill.slug, root_path
    ));

    let result = MarketplaceService::new().update(skill, &root_path);
    match &result {
        Ok(response) => logger.info(format!(
            "update_marketplace_skill success installed_path={}",
            response.installed_path
        )),
        Err(error) => logger.error(format!("update_marketplace_skill failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn uninstall_marketplace_skill(
    root_path: String,
) -> Result<MarketplaceUninstallResult, String> {
    let logger = BackendLogService::shared();
    logger.info(format!("uninstall_marketplace_skill root_path={root_path}"));

    let result = MarketplaceService::new().uninstall(&root_path);
    match &result {
        Ok(response) => logger.info(format!(
            "uninstall_marketplace_skill success removed_path={}",
            response.removed_path
        )),
        Err(error) => logger.error(format!("uninstall_marketplace_skill failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn scan_system_skills(scan_roots: Option<Vec<String>>) -> Result<SkillScanResponse, String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "scan_system_skills requested scan_roots={scan_roots:?}"
    ));

    let result = SkillService::new().scan(scan_roots);
    match &result {
        Ok(response) => logger.info(format!(
            "scan_system_skills success roots={:?} skills={} duration_ms={}",
            response.scanned_roots,
            response.skills.len(),
            response.duration_ms
        )),
        Err(error) => logger.error(format!("scan_system_skills failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn scan_system_skills_tree(
    scan_roots: Option<Vec<String>>,
) -> Result<SkillTreeResponse, String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "scan_system_skills_tree requested scan_roots={scan_roots:?}"
    ));

    let result = SkillService::new().scan_tree(scan_roots);
    match &result {
        Ok(response) => logger.info(format!(
            "scan_system_skills_tree success roots={:?} tree_roots={} duration_ms={}",
            response.scanned_roots,
            response.roots.len(),
            response.duration_ms
        )),
        Err(error) => logger.error(format!("scan_system_skills_tree failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn load_system_skill(root_path: String) -> Result<SystemSkillContentResponse, String> {
    let logger = BackendLogService::shared();
    logger.info(format!("load_system_skill root_path={root_path}"));

    let result = SkillService::new().load_from_root(root_path);
    match &result {
        Ok(response) => logger.info(format!(
            "load_system_skill success files={}",
            response.files.len()
        )),
        Err(error) => logger.error(format!("load_system_skill failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn list_system_skill_files(root_path: String) -> Result<Vec<SystemSkillTreeFile>, String> {
    let logger = BackendLogService::shared();
    logger.info(format!("list_system_skill_files root_path={root_path}"));

    let result = SkillService::new().list_from_root(root_path);
    match &result {
        Ok(files) => logger.info(format!(
            "list_system_skill_files success files={}",
            files.len()
        )),
        Err(error) => logger.error(format!("list_system_skill_files failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn save_system_skill_file(
    root_path: String,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "save_system_skill_file root_path={} relative_path={} bytes={}",
        root_path,
        relative_path,
        content.len()
    ));

    let result = SkillService::new().save_file(root_path, relative_path, content);
    match &result {
        Ok(()) => logger.info("save_system_skill_file success"),
        Err(error) => logger.error(format!("save_system_skill_file failed: {error}")),
    }

    result
}

#[tauri::command]
pub fn read_backend_logs() -> Result<BackendLogSnapshot, String> {
    BackendLogService::shared().read_snapshot()
}

#[tauri::command]
pub fn clear_backend_logs() -> Result<(), String> {
    BackendLogService::shared().clear()
}
