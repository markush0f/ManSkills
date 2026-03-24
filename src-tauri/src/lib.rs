#[tauri::command]
fn tauri_greeting() -> String {
    "Hola, esto esta creado con Tauri!".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![tauri_greeting])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
