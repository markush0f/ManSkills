use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
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
    pub url: Option<String>,
}
