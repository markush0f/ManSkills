use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceSource {
    pub source: String,
    pub owner: String,
    pub repo: String,
    pub skill_count: u64,
    pub total_installs: u64,
    pub github_url: String,
}
