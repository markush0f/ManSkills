use crate::{
    models::{
        BackendLogSnapshot, MarketplaceInstallResult, MarketplaceSearchResponse, MarketplaceSkill,
        MarketplaceSource, MarketplaceUninstallResult, SkillClassificationSettings,
        SkillScanResponse, SkillTreeResponse, SystemSkillContentResponse, SystemSkillTreeFile,
        SystemSkillTreeNode,
    },
    services::{BackendLogService, MarketplaceService, SkillClassificationService, SkillService},
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
pub fn load_marketplace_top_sources(limit: Option<u32>) -> Result<Vec<MarketplaceSource>, String> {
    let logger = BackendLogService::shared();
    logger.info(format!("load_marketplace_top_sources limit={limit:?}"));

    let result = MarketplaceService::new().top_sources(limit);
    match &result {
        Ok(sources) => logger.info(format!(
            "load_marketplace_top_sources success total={}",
            sources.len()
        )),
        Err(error) => logger.error(format!("load_marketplace_top_sources failed: {error}")),
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
            "scan_system_skills_tree success roots={:?} tree_roots={} skill_nodes={} duration_ms={}",
            response.scanned_roots,
            response.roots.len(),
            count_skill_nodes(&response.roots),
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
pub fn load_skill_classification_settings() -> Result<SkillClassificationSettings, String> {
    SkillClassificationService::new().load()
}

#[tauri::command]
pub fn save_skill_classification_settings(
    settings: SkillClassificationSettings,
) -> Result<SkillClassificationSettings, String> {
    let logger = BackendLogService::shared();
    logger.info("save_skill_classification_settings requested");

    let result = SkillClassificationService::new().save(settings);
    if let Err(error) = &result {
        logger.error(format!(
            "save_skill_classification_settings failed: {error}"
        ));
    }

    result
}

#[tauri::command]
pub fn reveal_in_file_explorer(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    let dir = if path.is_file() {
        path.parent()
    } else {
        Some(path)
    }
    .ok_or("Invalid path")?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open finder: {e}"))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
pub fn clear_backend_logs() -> Result<(), String> {
    BackendLogService::shared().clear()
}

#[tauri::command]
pub fn open_skill_install_command(
    source: String,
    skill_id: String,
    target: String,
    collection: Option<String>,
) -> Result<(), String> {
    let logger = BackendLogService::shared();
    logger.info(format!(
        "open_skill_install_command source={} skill_id={} target={} collection={:?}",
        source, skill_id, target, collection
    ));

    let install_path = if let Some(coll) = collection {
        format!("{}/{}/{}", target, coll, skill_id)
    } else {
        format!("{}/{}", target, skill_id)
    };

    let skill_ref = format!("{}/{}", source, skill_id);
    let command = format!("npx skills add {}", skill_ref);

    #[cfg(target_os = "windows")]
    {
        fn clean_windows_path(path: &str) -> String {
            path.replace("\\\\?\\", "").replace("\\\\", "\\")
        }

        let workspace_dir = std::env::current_dir()
            .map(|p| clean_windows_path(&p.to_string_lossy().to_string()))
            .unwrap_or_else(|_| {
                dirs::home_dir()
                    .map(|h| clean_windows_path(&h.to_string_lossy().into_owned()))
                    .unwrap_or_else(|| "C:\\Users\\Public".to_string())
            });

        let full_command = format!(
            "cd /d \"{}\" && {}",
            workspace_dir,
            command
        );

        logger.info(format!("Opening terminal with: {}", full_command));

        std::process::Command::new("cmd.exe")
            .args(["/c", "start", "cmd", "/k", &full_command])
            .spawn()
            .map_err(|e| format!("Failed to spawn cmd.exe: {e}"))?;

        logger.info("Terminal spawned successfully");
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        let workspace_dir = std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| "~".to_string());

        let full_command = format!("cd \"{}\" && {}", workspace_dir, command);

        logger.info(format!("Opening terminal with: {}", full_command));

        std::process::Command::new("x-terminal-emulator")
            .args(["-e", &full_command])
            .spawn()
            .map_err(|e| format!("Failed to spawn terminal: {e}"))?;

        logger.info("Terminal spawned successfully");
        Ok(())
    }
}

fn count_skill_nodes(nodes: &[SystemSkillTreeNode]) -> usize {
    nodes
        .iter()
        .map(|node| {
            let current = usize::from(node.kind == "skill");
            current + count_skill_nodes(&node.children)
        })
        .sum()
}
