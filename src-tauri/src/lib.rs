mod constants;
pub mod models;
pub mod services;
mod tauri_commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tauri_commands::scan_system_skills,
            tauri_commands::scan_system_skills_tree,
            tauri_commands::load_system_skill,
            tauri_commands::save_system_skill_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
