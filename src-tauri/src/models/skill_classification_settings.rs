use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillClassificationSettings {
    #[serde(default)]
    pub global_roots: Vec<String>,
    #[serde(default)]
    pub provider_directories: Vec<String>,
    #[serde(default)]
    pub hidden_directories: Vec<String>,
    #[serde(default)]
    pub custom_scan_roots: Vec<String>,
}
