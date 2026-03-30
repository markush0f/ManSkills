use serde::Serialize;

use crate::models::SystemSkillFile;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSkillContentResponse {
    pub root_path: String,
    pub files: Vec<SystemSkillFile>,
}
