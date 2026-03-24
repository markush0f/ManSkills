use std::{path::Path, time::Instant};

use crate::{
    models::{SkillTreeResponse, SystemSkill, SystemSkillTreeNode},
    services::skill_catalog::SkillCatalogService,
};

pub struct SkillTreeService {
    catalog: SkillCatalogService,
}

impl SkillTreeService {
    pub fn new() -> Self {
        Self {
            catalog: SkillCatalogService::new(),
        }
    }

    pub fn scan_tree(&self, scan_roots: Option<Vec<String>>) -> Result<SkillTreeResponse, String> {
        let started_at = Instant::now();
        let scan_response = self.catalog.scan(scan_roots)?;
        let roots = build_tree(&scan_response.scanned_roots, scan_response.skills);

        Ok(SkillTreeResponse {
            roots,
            scanned_roots: scan_response.scanned_roots,
            duration_ms: started_at.elapsed().as_millis(),
        })
    }
}

impl Default for SkillTreeService {
    fn default() -> Self {
        Self::new()
    }
}

fn build_tree(scanned_roots: &[String], skills: Vec<SystemSkill>) -> Vec<SystemSkillTreeNode> {
    let mut roots = scanned_roots
        .iter()
        .map(|root| SystemSkillTreeNode {
            id: format!("root:{root}"),
            name: node_name(Path::new(root), root),
            path: root.clone(),
            kind: "root".to_string(),
            skill: None,
            children: Vec::new(),
        })
        .collect::<Vec<_>>();

    for skill in skills {
        let Some(root_index) = find_best_root_index(scanned_roots, &skill.root_path) else {
            continue;
        };

        let scan_root = Path::new(&scanned_roots[root_index]);
        let skill_root_path = skill.root_path.clone();
        let skill_root = Path::new(&skill_root_path);
        let Ok(relative_path) = skill_root.strip_prefix(scan_root) else {
            continue;
        };

        insert_skill(&mut roots[root_index], relative_path, skill);
    }

    roots.retain(|root| !root.children.is_empty());
    sort_tree_nodes(&mut roots);
    roots
}

fn insert_skill(root: &mut SystemSkillTreeNode, relative_path: &Path, skill: SystemSkill) {
    let components = relative_path
        .iter()
        .map(|component| component.to_string_lossy().into_owned())
        .collect::<Vec<_>>();

    if components.is_empty() {
        root.children.push(skill_leaf_node(skill));
        return;
    }

    let mut current = root;

    for component in &components[..components.len().saturating_sub(1)] {
        let next_path = Path::new(&current.path).join(component);
        let next_path_string = next_path.to_string_lossy().into_owned();

        let existing_index = current
            .children
            .iter()
            .position(|child| child.kind == "directory" && child.path == next_path_string);

        let index = match existing_index {
            Some(index) => index,
            None => {
                current.children.push(SystemSkillTreeNode {
                    id: format!("directory:{next_path_string}"),
                    name: component.clone(),
                    path: next_path_string,
                    kind: "directory".to_string(),
                    skill: None,
                    children: Vec::new(),
                });
                current.children.len() - 1
            }
        };

        current = &mut current.children[index];
    }

    current.children.push(skill_leaf_node(skill));
}

fn skill_leaf_node(skill: SystemSkill) -> SystemSkillTreeNode {
    SystemSkillTreeNode {
        id: format!("skill:{}", skill.id),
        name: skill.name.clone(),
        path: skill.root_path.clone(),
        kind: "skill".to_string(),
        skill: Some(skill),
        children: Vec::new(),
    }
}

fn find_best_root_index(scanned_roots: &[String], skill_root_path: &str) -> Option<usize> {
    let skill_root = Path::new(skill_root_path);

    scanned_roots
        .iter()
        .enumerate()
        .filter_map(|(index, root)| {
            let root_path = Path::new(root);
            if skill_root.starts_with(root_path) {
                Some((index, component_count(root_path)))
            } else {
                None
            }
        })
        .max_by_key(|(_, depth)| *depth)
        .map(|(index, _)| index)
}

fn component_count(path: &Path) -> usize {
    path.components().count()
}

fn node_name(path: &Path, fallback: &str) -> String {
    path.file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(fallback)
        .to_string()
}

fn sort_tree_nodes(nodes: &mut [SystemSkillTreeNode]) {
    nodes.sort_by(|left, right| {
        node_kind_rank(&left.kind)
            .cmp(&node_kind_rank(&right.kind))
            .then_with(|| {
                left.name
                    .to_ascii_lowercase()
                    .cmp(&right.name.to_ascii_lowercase())
            })
            .then_with(|| left.path.cmp(&right.path))
    });

    for node in nodes {
        sort_tree_nodes(&mut node.children);
    }
}

fn node_kind_rank(kind: &str) -> u8 {
    match kind {
        "root" => 0,
        "directory" => 1,
        "skill" => 2,
        _ => 3,
    }
}
