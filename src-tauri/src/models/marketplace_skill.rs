use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceSkill {
    pub id: String,
    pub slug: String,
    pub name: String,
    pub summary: String,
    pub repository: String,
    pub author: String,
    pub stars: Option<u64>,
    pub updated_at: Option<String>,
    pub github_url: Option<String>,
    pub skill_url: Option<String>,
}
