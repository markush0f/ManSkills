use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceInstallMetadata {
    pub skill_id: Option<String>,
    pub slug: String,
    pub name: String,
    pub github_url: Option<String>,
    pub skill_url: Option<String>,
    pub remote_updated_at: Option<String>,
    pub install_target: Option<String>,
    pub install_collection: Option<String>,
    pub installed_at: String,
    pub installed_path: String,
    pub installer: String,
}
