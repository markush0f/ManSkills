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

    tauri::Builder::default()
        .setup(|app| {
            services::SkillWatchState::install(&app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tauri_commands::search_marketplace_skills,
            tauri_commands::install_marketplace_skill,
            tauri_commands::load_marketplace_skill_manifest,
            tauri_commands::scan_system_skills,
            tauri_commands::scan_system_skills_tree,
            tauri_commands::load_system_skill,
            tauri_commands::list_system_skill_files,
            tauri_commands::save_system_skill_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
