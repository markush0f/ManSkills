use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendLogSnapshot {
    pub content: String,
    pub path: String,
    pub truncated: bool,
}
