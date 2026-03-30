use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceUninstallResult {
    pub removed_path: String,
    pub skill_id: Option<String>,
}
