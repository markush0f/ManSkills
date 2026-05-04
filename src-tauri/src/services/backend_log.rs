use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::{Mutex, OnceLock},
    time::{SystemTime, UNIX_EPOCH},
};

use crate::models::BackendLogSnapshot;

const APP_LOG_DIRECTORY: &str = "skills-ide/logs";
const BACKEND_LOG_FILE_NAME: &str = "backend.log";
const MAX_LOG_BYTES: u64 = 1_000_000;
const RETAIN_LOG_BYTES: usize = 300_000;
const READ_LOG_BYTES: usize = 120_000;

pub struct BackendLogService {
    path: PathBuf,
    write_lock: Mutex<()>,
}

impl BackendLogService {
    pub fn shared() -> &'static Self {
        static INSTANCE: OnceLock<BackendLogService> = OnceLock::new();
        INSTANCE.get_or_init(Self::new)
    }

    fn new() -> Self {
        Self {
            path: resolve_log_path(),
            write_lock: Mutex::new(()),
        }
    }

    pub fn read_snapshot(&self) -> Result<BackendLogSnapshot, String> {
        self.ensure_parent_directory()?;

        let content = fs::read_to_string(&self.path).unwrap_or_default();
        let (content, truncated) = tail_content(content, READ_LOG_BYTES);

        Ok(BackendLogSnapshot {
            content,
            path: self.path.to_string_lossy().into_owned(),
            truncated,
        })
    }

    pub fn clear(&self) -> Result<(), String> {
        let _guard = self
            .write_lock
            .lock()
            .map_err(|_| "backend log lock poisoned".to_string())?;

        self.ensure_parent_directory()?;
        fs::write(&self.path, "").map_err(|error| format!("could not clear backend log: {error}"))
    }

    pub fn info<S>(&self, message: S)
    where
        S: AsRef<str>,
    {
        let _ = self.append("INFO", message.as_ref());
    }

    pub fn warn<S>(&self, message: S)
    where
        S: AsRef<str>,
    {
        let _ = self.append("WARN", message.as_ref());
    }

    pub fn error<S>(&self, message: S)
    where
        S: AsRef<str>,
    {
        let _ = self.append("ERROR", message.as_ref());
    }

    fn append(&self, level: &str, message: &str) -> Result<(), String> {
        let _guard = self
            .write_lock
            .lock()
            .map_err(|_| "backend log lock poisoned".to_string())?;

        self.ensure_parent_directory()?;
        trim_log_file_if_needed(&self.path)?;

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)
            .map_err(|error| format!("could not open backend log file: {error}"))?;
        let entry = format!("[{}] [{}] {}\n", unix_timestamp_ms(), level, message);

        file.write_all(entry.as_bytes())
            .map_err(|error| format!("could not write backend log entry: {error}"))
    }

    fn ensure_parent_directory(&self) -> Result<(), String> {
        let Some(parent) = self.path.parent() else {
            return Err("backend log path has no parent directory".to_string());
        };

        fs::create_dir_all(parent)
            .map_err(|error| format!("could not create backend log directory: {error}"))
    }
}

fn resolve_log_path() -> PathBuf {
    let base_dir = dirs::data_local_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(std::env::temp_dir);

    base_dir.join(APP_LOG_DIRECTORY).join(BACKEND_LOG_FILE_NAME)
}

fn trim_log_file_if_needed(path: &Path) -> Result<(), String> {
    let Ok(metadata) = fs::metadata(path) else {
        return Ok(());
    };

    if metadata.len() <= MAX_LOG_BYTES {
        return Ok(());
    }

    let content = fs::read_to_string(path)
        .map_err(|error| format!("could not trim backend log file: {error}"))?;
    let (trimmed_content, _) = tail_content(content, RETAIN_LOG_BYTES);

    fs::write(path, trimmed_content)
        .map_err(|error| format!("could not rewrite trimmed backend log file: {error}"))
}

fn tail_content(mut content: String, max_bytes: usize) -> (String, bool) {
    if content.len() <= max_bytes {
        return (content, false);
    }

    let mut start_index = content.len().saturating_sub(max_bytes);
    while !content.is_char_boundary(start_index) && start_index < content.len() {
        start_index += 1;
    }

    let tail = content.split_off(start_index);
    let tail = tail
        .find('\n')
        .map(|offset| tail[offset + 1..].to_string())
        .unwrap_or(tail);

    (tail, true)
}

fn unix_timestamp_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}
