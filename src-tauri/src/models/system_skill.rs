use serde::Serialize;

use crate::models::MarketplaceInstallMetadata;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSkill {
    pub id: String,
    pub slug: String,
    pub name: String,
    pub summary: String,
    pub manifest_path: String,
    pub root_path: String,
    pub source: String,
    pub marketplace_install: Option<MarketplaceInstallMetadata>,
    pub git_repository_root_path: Option<String>,
}
