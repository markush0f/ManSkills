use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSkillFile {
    pub id: String,
    pub relative_path: String,
    pub language: String,
    pub content: String,
}
