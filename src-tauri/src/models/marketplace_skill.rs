use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceSkill {
    pub source: String,
    pub skill_id: String,
    pub name: String,
    pub display_name: String,
    pub installs: u64,
    pub owner: String,
    pub repo: String,
    pub github_url: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PaginatedSkillsResponse {
    pub skills: Vec<MarketplaceSkill>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
    pub total_pages: u32,
}