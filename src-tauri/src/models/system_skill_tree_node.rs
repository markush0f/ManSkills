use serde::Serialize;

use crate::models::SystemSkill;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSkillTreeNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub kind: String,
    pub skill: Option<SystemSkill>,
    pub children: Vec<SystemSkillTreeNode>,
}
