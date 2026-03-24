use crate::models::{SkillScanResponse, SkillTreeResponse, SystemSkillContentResponse};
use crate::services::{
    skill_catalog::SkillCatalogService, skill_content::SkillContentService,
    skill_tree::SkillTreeService,
};

pub struct SkillService {
    catalog: SkillCatalogService,
    content: SkillContentService,
    tree: SkillTreeService,
}

impl SkillService {
    pub fn new() -> Self {
        Self {
            catalog: SkillCatalogService::new(),
            content: SkillContentService::new(),
            tree: SkillTreeService::new(),
        }
    }

    pub fn scan(&self, scan_roots: Option<Vec<String>>) -> Result<SkillScanResponse, String> {
        self.catalog.scan(scan_roots)
    }

    pub fn scan_tree(&self, scan_roots: Option<Vec<String>>) -> Result<SkillTreeResponse, String> {
        self.tree.scan_tree(scan_roots)
    }

    pub fn load_from_root<P>(&self, root_path: P) -> Result<SystemSkillContentResponse, String>
    where
        P: AsRef<str>,
    {
        self.content.load_from_root(root_path)
    }
}

impl Default for SkillService {
    fn default() -> Self {
        Self::new()
    }
}
