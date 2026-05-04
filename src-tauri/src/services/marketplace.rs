use std::{
    fs,
    path::{Path, PathBuf},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use base64::Engine;
use reqwest::blocking::Client;
use serde::Deserialize;
use serde_json::Value;

use crate::models::{MarketplaceInstallResult, MarketplaceSearchResponse, MarketplaceSkill};

const DEFAULT_LIMIT: u32 = 20;
const DEFAULT_PAGE: u32 = 1;
const MAX_LIMIT: u32 = 100;
const API_BASE_URL: &str = "http://localhost:3456/api";

fn get_skills_api_port() -> u16 {
    let port_file = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("server-skills")
        .join("skills-api")
        .join(".skills-api-port");
    
    std::fs::read_to_string(&port_file)
        .ok()
        .and_then(|s| s.trim().parse().ok())
        .unwrap_or(3456)
}

fn get_api_base_url() -> String {
    let port = get_skills_api_port();
    format!("http://localhost:{}/api", port)
}
const USER_AGENT: &str = "skills-ide-marketplace";
const SKILL_MANIFEST_NAME: &str = "SKILL.md";

pub struct MarketplaceService {
    client: Client,
}

impl MarketplaceService {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .expect("marketplace http client should build");

        Self { client }
    }

    pub fn search(
        &self,
        query: Option<String>,
        page: Option<u32>,
        limit: Option<u32>,
    ) -> Result<MarketplaceSearchResponse, String> {
        let started_at = Instant::now();
        let normalized_page = page.unwrap_or(DEFAULT_PAGE).max(1);
        let normalized_limit = limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);

        let api_base = get_api_base_url();
        let url = if query.is_some() {
            format!("{}/skills", api_base)
        } else {
            format!("{}/skills/top", api_base)
        };

        let mut request = self.client.get(&url);
        
        if let Some(q) = &query {
            request = request.query(&[("query", q.as_str())]);
        }
        
        request = request.query(&[
            ("page", &normalized_page.to_string()),
            ("pageSize", &normalized_limit.to_string()),
        ]);

        let response = request
            .send()
            .map_err(map_request_error)?;

        let status = response.status();
        
        if !status.is_success() {
            return Err(format!("skills-api returned error: {}", status));
        }

        let payload: Value = response
            .json()
            .map_err(|_| "skills-api devolvio una respuesta no valida.".to_string())?;

        parse_search_response(
            payload,
            query.unwrap_or_default(),
            normalized_page,
            normalized_limit,
            started_at.elapsed().as_millis(),
        )
    }

    pub fn install(
        &self,
        skill: MarketplaceSkill,
        target: String,
        collection: Option<String>,
    ) -> Result<MarketplaceInstallResult, String> {
        let install_root = resolve_install_root(&target, collection.as_deref())?;

        fs::create_dir_all(&install_root)
            .map_err(|_| "No se pudo preparar el directorio de instalacion.".to_string())?;

        let skill_id = skill.skill_id.clone();
        let final_root = install_root.join(&skill.skill_id);
        
        if final_root.exists() {
            return Err("La skill ya existe en el destino seleccionado.".to_string());
        }

        let temp_root = install_root.join(format!(
            ".{}-tmp-{}",
            skill.skill_id,
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|value| value.as_nanos())
                .unwrap_or(0)
        ));

        fs::create_dir_all(&temp_root)
            .map_err(|_| "No se pudo crear el directorio temporal de instalacion.".to_string())?;

        let file_count = self.download_skill_files(&skill, &temp_root)?;
        let skill_id_for_result = skill.skill_id.clone();

        if !temp_root.join(SKILL_MANIFEST_NAME).exists() {
            let _ = fs::remove_dir_all(&temp_root);
            return Err("La skill descargada no contiene SKILL.md.".to_string());
        }

        fs::rename(&temp_root, &final_root).map_err(|_| {
            let _ = fs::remove_dir_all(&temp_root);
            "No se pudo mover la skill instalada al destino final.".to_string()
        })?;

        Ok(MarketplaceInstallResult {
            skill_id: skill_id_for_result,
            slug: skill_id,
            target,
            installed_path: final_root.to_string_lossy().into_owned(),
            file_count: file_count as usize,
        })
    }

    pub fn load_manifest(&self, skill: &MarketplaceSkill) -> Result<String, String> {
        let api_base = get_api_base_url();
        let url = format!(
            "{}/skills/{}/{}/{}",
            api_base, skill.owner, skill.repo, skill.skill_id
        );

        let response = self
            .client
            .get(&url)
            .send()
            .map_err(map_request_error)?;

        if !response.status().is_success() {
            return Err(format!("No se pudo cargar el manifest: {}", response.status()));
        }

        let payload: Value = response
            .json()
            .map_err(|_| "skills-api devolvio una respuesta no valida.".to_string())?;

        Ok(serde_json::to_string_pretty(&payload).unwrap_or_default())
    }

    fn download_skill_files(&self, skill: &MarketplaceSkill, dest: &Path) -> Result<u32, String> {
        let api_base = get_api_base_url();
        let url = format!(
            "{}/skills/{}/{}/{}/files",
            api_base, skill.owner, skill.repo, skill.skill_id
        );

        let response = self
            .client
            .get(&url)
            .send()
            .map_err(map_request_error)?;

        if !response.status().is_success() {
            return Err(format!("No se pudieron descargar los archivos: {}", response.status()));
        }

        let files: Vec<SkillFile> = response
            .json()
            .map_err(|_| "skills-api devolvio una lista de archivos no valida.".to_string())?;

        let mut count = 0;
        for file in files {
            let file_path = dest.join(&file.path);
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|_| format!("No se pudo crear el directorio: {:?}", parent))?;
            }
            let content = if file.encoding == "base64" {
                let decoded = base64_decode(&file.content)?;
                decoded
            } else {
                file.content.into_bytes()
            };
            fs::write(&file_path, content)
                .map_err(|_| format!("No se pudo escribir el archivo: {}", file.path))?;
            count += 1;
        }

        Ok(count)
    }
}

impl Default for MarketplaceService {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Deserialize)]
struct SkillFile {
    path: String,
    content: String,
    encoding: String,
}

fn parse_search_response(
    payload: Value,
    query: String,
    page: u32,
    limit: u32,
    duration_ms: u128,
) -> Result<MarketplaceSearchResponse, String> {
    let total = payload
        .get("total")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    
    let skills_array = payload
        .get("skills")
        .and_then(|v| v.as_array())
        .ok_or("skills-api no devolvio una lista de skills valida.")?;

    let skills = skills_array
        .iter()
        .filter_map(parse_marketplace_skill)
        .collect::<Vec<_>>();

    Ok(MarketplaceSearchResponse {
        total: Some(total),
        skills,
        query,
        page,
        limit,
        duration_ms,
    })
}

fn parse_marketplace_skill(skill: &Value) -> Option<MarketplaceSkill> {
    let source = skill.get("source")?.as_str()?.to_string();
    let parts: Vec<&str> = source.split('/').collect();
    if parts.len() != 2 {
        return None;
    }
    let owner = parts[0].to_string();
    let repo = parts[1].to_string();

    let skill_id = skill.get("skillId")?.as_str()?.to_string();
    let name = skill.get("name")?.as_str()?.to_string();
    let display_name = skill.get("displayName")?.as_str()?.to_string();
    let installs = skill.get("installs")?.as_u64()?;
    let github_url = skill.get("githubUrl")?.as_str()?.to_string();

    Some(MarketplaceSkill {
        source,
        skill_id,
        name,
        display_name,
        installs,
        owner,
        repo,
        github_url,
    })
}

fn map_request_error(error: reqwest::Error) -> String {
    if error.is_timeout() {
        return "skills-api tardo demasiado en responder.".to_string();
    }

    format!("No se pudo conectar con skills-api: {}", error)
}

fn resolve_install_root(target: &str, collection: Option<&str>) -> Result<PathBuf, String> {
    let mut root = match target {
        "codex" => dirs::home_dir()
            .map(|home| home.join(".codex").join("skills"))
            .ok_or_else(|| "No se pudo resolver el home para instalar en Codex.".to_string()),
        "claude" => dirs::home_dir()
            .map(|home| home.join(".claude").join("skills"))
            .ok_or_else(|| "No se pudo resolver el home para instalar en Claude.".to_string()),
        "workspace" => std::env::current_dir()
            .map(|path| path.join(".agents").join("skills"))
            .map_err(|_| "No se pudo resolver el workspace actual.".to_string()),
        _ => Err("Destino de instalacion no soportado.".to_string()),
    }?;

    if let Some(segments) = normalize_install_collection(collection)? {
        for segment in segments {
            root.push(segment);
        }
    }

    Ok(root)
}

fn normalize_install_collection(collection: Option<&str>) -> Result<Option<Vec<String>>, String> {
    let Some(raw_collection) = collection else {
        return Ok(None);
    };

    let trimmed = raw_collection.trim().trim_matches(['/', '\\']);
    if trimmed.is_empty() {
        return Ok(None);
    }

    let mut segments = Vec::new();

    for segment in trimmed.split(['/', '\\']) {
        let value = segment.trim();
        if value.is_empty() || value == "." || value == ".." {
            return Err("La coleccion de instalacion no es valida.".to_string());
        }

        if !value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.'))
        {
            return Err("La coleccion de instalacion contiene caracteres no validos.".to_string());
        }

        segments.push(value.to_string());
    }

    Ok(Some(segments))
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    base64::engine::general_purpose::STANDARD
        .decode(input)
        .map_err(|e| format!("Error al decodificar base64: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_search_response_with_skills_api_format() {
        let payload = json!({
            "skills": [
                {
                    "source": "vercel-labs/agent-skills",
                    "skillId": "vercel-react-best-practices",
                    "name": "vercel-react-best-practices",
                    "displayName": "Vercel React Best Practices",
                    "installs": 69954,
                    "owner": "vercel-labs",
                    "repo": "agent-skills",
                    "githubUrl": "https://github.com/vercel-labs/agent-skills"
                }
            ],
            "total": 34311,
            "page": 1,
            "pageSize": 20,
            "totalPages": 1716
        });

        let response = parse_search_response(payload, "react".to_string(), 1, 20, 12)
            .expect("response should parse");

        assert_eq!(response.skills.len(), 1);
        assert_eq!(response.total, Some(34311));
        assert_eq!(response.skills[0].owner, "vercel-labs");
        assert_eq!(response.skills[0].repo, "agent-skills");
        assert_eq!(response.skills[0].skill_id, "vercel-react-best-practices");
    }

    #[test]
    fn resolve_install_root_supports_workspace_target() {
        let root = resolve_install_root("workspace", None).expect("workspace target should resolve");

        assert!(root.to_string_lossy().contains(".agents"));
        assert!(root.to_string_lossy().contains("skills"));
    }

    #[test]
    fn resolve_install_root_appends_collection_segments() {
        let root = resolve_install_root("workspace", Some("team/marketplace"))
            .expect("workspace target with collection should resolve");

        assert!(root.to_string_lossy().contains(".agents"));
        assert!(root.to_string_lossy().contains("team"));
        assert!(root.to_string_lossy().contains("marketplace"));
    }

    #[test]
    fn normalize_install_collection_rejects_parent_segments() {
        let error =
            normalize_install_collection(Some("../private")).expect_err("parent segments should be rejected");
        assert!(error.contains("no valida"));
    }

    #[test]
    fn normalize_install_collection_accepts_valid_segments() {
        let result = normalize_install_collection(Some("team/marketplace"))
            .expect("should accept valid segments");
        assert_eq!(result, Some(vec!["team".to_string(), "marketplace".to_string()]));
    }
}