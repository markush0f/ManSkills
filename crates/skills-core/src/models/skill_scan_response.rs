use serde::Serialize;

use crate::models::SystemSkill;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillScanResponse {
    pub skills: Vec<SystemSkill>,
    pub scanned_roots: Vec<String>,
    pub duration_ms: u128,
}
