use serde::Serialize;

use crate::models::{SystemSkill, SystemSkillTreeFile};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSkillTreeNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub kind: String,
    pub skill: Option<SystemSkill>,
    pub file: Option<SystemSkillTreeFile>,
    pub children: Vec<SystemSkillTreeNode>,
}
