mod constants;
pub mod models;
pub mod services;
mod tauri_commands;

fn load_project_env() {
    let _ = dotenvy::from_filename(".env");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    load_project_env();
    services::BackendLogService::shared().info("backend startup");
    services::BackendLogService::shared().info(format!(
        "resolved skill roots scan={:?} watch={:?}",
        services::build_scan_roots(None)
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect::<Vec<_>>(),
        services::build_watch_roots(None)
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect::<Vec<_>>()
    ));

    tauri::Builder::default()
        .setup(|app| {
            services::BackendLogService::shared().info("installing skill watcher");
            services::SkillWatchState::install(&app.handle())?;
            services::BackendLogService::shared().info("skill watcher installed");
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tauri_commands::read_backend_logs,
            tauri_commands::clear_backend_logs,
            tauri_commands::search_marketplace_skills,
            tauri_commands::load_marketplace_top_sources,
            tauri_commands::install_marketplace_skill,
            tauri_commands::load_marketplace_skill_manifest,
            tauri_commands::update_marketplace_skill,
            tauri_commands::uninstall_marketplace_skill,
            tauri_commands::scan_system_skills,
            tauri_commands::scan_system_skills_tree,
            tauri_commands::load_system_skill,
            tauri_commands::list_system_skill_files,
            tauri_commands::save_system_skill_file,
            tauri_commands::load_skill_classification_settings,
            tauri_commands::save_skill_classification_settings,
            tauri_commands::reveal_in_file_explorer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
