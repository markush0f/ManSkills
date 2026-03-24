use serde::Serialize;

use crate::models::SystemSkillTreeNode;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillTreeResponse {
    pub roots: Vec<SystemSkillTreeNode>,
    pub scanned_roots: Vec<String>,
    pub duration_ms: u128,
}
