use serde::Serialize;

use crate::models::MarketplaceSkill;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceSearchResponse {
    pub skills: Vec<MarketplaceSkill>,
    pub query: String,
    pub page: u32,
    pub limit: u32,
    pub total: Option<u64>,
    pub duration_ms: u128,
}
