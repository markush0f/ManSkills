use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceInstallResult {
    pub skill_id: String,
    pub slug: String,
    pub target: String,
    pub installed_path: String,
    pub file_count: usize,
}
