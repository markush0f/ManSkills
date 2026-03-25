use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
pub struct SkillWatchEvent {
    pub paths: Vec<String>,
}
