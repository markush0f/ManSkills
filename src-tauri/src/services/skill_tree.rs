use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    time::Instant,
};

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
    let mut roots = Vec::<SystemSkillTreeNode>::new();
    let mut root_indexes = HashMap::<String, usize>::new();

    for skill in skills {
        let Some(root_path) = find_best_root_path(scanned_roots, &skill.root_path) else {
            continue;
        };

        let root_index = ensure_root(&mut roots, &mut root_indexes, &root_path);
        let scan_root = Path::new(&root_path);
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

fn ensure_root(
    roots: &mut Vec<SystemSkillTreeNode>,
    root_indexes: &mut HashMap<String, usize>,
    root_path: &str,
) -> usize {
    if let Some(index) = root_indexes.get(root_path).copied() {
        return index;
    }

    let index = roots.len();
    roots.push(SystemSkillTreeNode {
        id: format!("root:{root_path}"),
        name: node_name(Path::new(root_path), root_path),
        path: root_path.to_string(),
        kind: "root".to_string(),
        skill: None,
        file: None,
        children: Vec::new(),
    });
    root_indexes.insert(root_path.to_string(), index);
    index
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
                    file: None,
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
        file: None,
        children: Vec::new(),
    }
}

fn find_best_root_path(scanned_roots: &[String], skill_root_path: &str) -> Option<String> {
    let skill_root = Path::new(skill_root_path);

    let best_scan_root = scanned_roots
        .iter()
        .filter_map(|root| {
            let root_path = Path::new(root);
            if skill_root.starts_with(root_path) {
                Some((root.as_str(), component_count(root_path)))
            } else {
                None
            }
        })
        .max_by_key(|(_, depth)| *depth)
        .map(|(root, _)| root.to_string())?;

    let best_scan_root_path = Path::new(&best_scan_root);

    if let Some(skills_container_root) = find_nearest_skills_container_root(skill_root) {
        if skill_root.starts_with(&skills_container_root)
            && component_count(&skills_container_root) > component_count(best_scan_root_path)
        {
            return Some(skills_container_root.to_string_lossy().into_owned());
        }
    }

    Some(best_scan_root)
}

fn find_nearest_skills_container_root(skill_root: &Path) -> Option<PathBuf> {
    skill_root
        .ancestors()
        .find(|ancestor| {
            ancestor
                .file_name()
                .and_then(|value| value.to_str())
                .map(|value| value.eq_ignore_ascii_case("skills"))
                .unwrap_or(false)
        })
        .map(Path::to_path_buf)
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
        "file" => 3,
        _ => 4,
    }
}
