use crate::models::{
    SkillScanResponse, SkillTreeResponse, SystemSkillContentResponse, SystemSkillTreeFile,
};
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

    pub fn list_from_root<P>(&self, root_path: P) -> Result<Vec<SystemSkillTreeFile>, String>
    where
        P: AsRef<str>,
    {
        self.content.list_from_root(root_path)
    }

    pub fn save_file<P, Q, C>(
        &self,
        root_path: P,
        relative_path: Q,
        content: C,
    ) -> Result<(), String>
    where
        P: AsRef<str>,
        Q: AsRef<str>,
        C: AsRef<str>,
    {
        self.content.save_file(root_path, relative_path, content)
    }
}

impl Default for SkillService {
    fn default() -> Self {
        Self::new()
    }
}
