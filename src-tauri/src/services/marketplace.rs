use std::{
    fs,
    path::{Path, PathBuf},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use reqwest::blocking::Client;
use serde_json::Value;

use crate::models::{
    MarketplaceInstallMetadata, MarketplaceInstallResult, MarketplaceSearchResponse,
    MarketplaceSkill, MarketplaceUninstallResult,
};

const DEFAULT_LIMIT: u32 = 20;
const DEFAULT_PAGE: u32 = 1;
const MAX_LIMIT: u32 = 100;
const SEARCH_URL: &str = "https://skillsmp.com/api/v1/skills/search";
const GITHUB_API_ROOT: &str = "https://api.github.com/repos";
const API_KEY_ENV: &str = "SKILLSMP_API_KEY";
const DEFAULT_SUMMARY: &str = "No summary provided by SkillsMP.";
const USER_AGENT: &str = "skills-ide-marketplace";
const SKILL_MANIFEST_NAME: &str = "SKILL.md";
const FEATURED_BROWSE_QUERY: &str = "skill";
pub(crate) const MARKETPLACE_INSTALL_METADATA_FILE_NAME: &str = ".skills-ide-marketplace.json";
const MARKETPLACE_INSTALLER_ID: &str = "skills-ide";

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
        let normalized_query = query.unwrap_or_default().trim().to_string();
        let normalized_page = page.unwrap_or(DEFAULT_PAGE).max(1);
        let normalized_limit = limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
        let search_request = build_search_request(&normalized_query);

        let api_key = std::env::var(API_KEY_ENV)
            .map_err(|_| "Falta la variable de entorno SKILLSMP_API_KEY.".to_string())?;

        let response = self
            .client
            .get(SEARCH_URL)
            .bearer_auth(api_key)
            .query(&[
                ("q", search_request.request_query.as_str()),
                ("page", &normalized_page.to_string()),
                ("limit", &normalized_limit.to_string()),
                ("sortBy", search_request.sort_by),
            ])
            .send()
            .map_err(map_request_error)?;

        let status = response.status();
        let payload: Value = response
            .json()
            .map_err(|_| "SkillsMP devolvio una respuesta no valida.".to_string())?;

        if !status.is_success() {
            return Err(map_api_error(status.as_u16(), &payload));
        }

        parse_search_response(
            payload,
            search_request.response_query,
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
        let github_url = skill
            .github_url
            .clone()
            .ok_or_else(|| "La skill no incluye una fuente GitHub instalable.".to_string())?;
        let reference = parse_github_tree_url(&github_url)?;
        let normalized_collection = normalize_install_collection(collection.as_deref())?;
        let normalized_collection_value = normalized_collection
            .as_ref()
            .map(|segments| segments.join("/"));
        let install_root = resolve_install_root(&target, normalized_collection.as_deref())?;

        fs::create_dir_all(&install_root)
            .map_err(|_| "No se pudo preparar el directorio de instalacion.".to_string())?;

        let final_root = install_root.join(&skill.slug);
        if final_root.exists() {
            return Err("La skill ya existe en el destino seleccionado.".to_string());
        }

        let temp_root = install_root.join(format!(
            ".{}-tmp-{}",
            skill.slug,
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|value| value.as_nanos())
                .unwrap_or(0)
        ));

        fs::create_dir_all(&temp_root)
            .map_err(|_| "No se pudo crear el directorio temporal de instalacion.".to_string())?;

        let install_result = self.download_directory(&reference, &temp_root, "")?;

        if !temp_root.join(SKILL_MANIFEST_NAME).exists() {
            let _ = fs::remove_dir_all(&temp_root);
            return Err("La skill descargada no contiene SKILL.md.".to_string());
        }

        let metadata = build_marketplace_install_metadata(
            &skill,
            &target,
            normalized_collection_value.as_deref(),
            &final_root,
            None,
        );
        write_marketplace_install_metadata(&temp_root, &metadata)?;

        fs::rename(&temp_root, &final_root).map_err(|_| {
            let _ = fs::remove_dir_all(&temp_root);
            "No se pudo mover la skill instalada al destino final.".to_string()
        })?;

        Ok(MarketplaceInstallResult {
            skill_id: skill.id,
            slug: skill.slug,
            target,
            installed_path: final_root.to_string_lossy().into_owned(),
            file_count: install_result,
        })
    }

    pub fn update(
        &self,
        skill: MarketplaceSkill,
        root_path: &str,
    ) -> Result<MarketplaceInstallResult, String> {
        let github_url = skill
            .github_url
            .clone()
            .ok_or_else(|| "La skill no incluye una fuente GitHub instalable.".to_string())?;
        let reference = parse_github_tree_url(&github_url)?;
        let final_root = PathBuf::from(root_path);
        let parent_root = final_root
            .parent()
            .map(Path::to_path_buf)
            .ok_or_else(|| "La ruta instalada de la skill no es valida.".to_string())?;
        let existing_metadata = read_marketplace_install_metadata(&final_root);
        let temp_root = build_temporary_skill_root(&parent_root, &skill.slug, "update");
        let backup_root = build_temporary_skill_root(&parent_root, &skill.slug, "backup");

        if !final_root.exists() {
            return Err("La skill instalada ya no existe en disco.".to_string());
        }

        fs::create_dir_all(&temp_root)
            .map_err(|_| "No se pudo crear el directorio temporal de actualizacion.".to_string())?;

        let file_count = self.download_directory(&reference, &temp_root, "")?;

        if !temp_root.join(SKILL_MANIFEST_NAME).exists() {
            let _ = fs::remove_dir_all(&temp_root);
            return Err("La actualizacion descargada no contiene SKILL.md.".to_string());
        }

        let metadata = build_marketplace_install_metadata(
            &skill,
            existing_metadata
                .as_ref()
                .and_then(|value| value.install_target.as_deref())
                .unwrap_or("workspace"),
            existing_metadata
                .as_ref()
                .and_then(|value| value.install_collection.as_deref()),
            &final_root,
            existing_metadata.as_ref(),
        );
        write_marketplace_install_metadata(&temp_root, &metadata)?;

        replace_directory_atomically(&temp_root, &final_root, &backup_root)?;

        Ok(MarketplaceInstallResult {
            skill_id: skill.id,
            slug: skill.slug,
            target: metadata
                .install_target
                .unwrap_or_else(|| "workspace".to_string()),
            installed_path: final_root.to_string_lossy().into_owned(),
            file_count,
        })
    }

    pub fn uninstall(&self, root_path: &str) -> Result<MarketplaceUninstallResult, String> {
        let final_root = PathBuf::from(root_path);
        let metadata = read_marketplace_install_metadata(&final_root).ok_or_else(|| {
            "La skill seleccionada no esta gestionada por el marketplace.".to_string()
        })?;

        if !final_root.exists() {
            return Err("La skill instalada ya no existe en disco.".to_string());
        }

        fs::remove_dir_all(&final_root)
            .map_err(|_| "No se pudo eliminar la skill instalada.".to_string())?;

        Ok(MarketplaceUninstallResult {
            removed_path: final_root.to_string_lossy().into_owned(),
            skill_id: metadata.skill_id,
        })
    }

    pub fn load_manifest(&self, skill: &MarketplaceSkill) -> Result<String, String> {
        let github_url = skill
            .github_url
            .as_deref()
            .ok_or_else(|| "La skill no incluye una fuente GitHub instalable.".to_string())?;
        let reference = parse_github_tree_url(github_url)?;

        self.fetch_github_file_text(&reference, SKILL_MANIFEST_NAME)
    }
}

impl Default for MarketplaceService {
    fn default() -> Self {
        Self::new()
    }
}

struct SearchRequest<'a> {
    request_query: String,
    response_query: String,
    sort_by: &'a str,
}

fn build_search_request(query: &str) -> SearchRequest<'static> {
    if query.is_empty() {
        return SearchRequest {
            request_query: FEATURED_BROWSE_QUERY.to_string(),
            response_query: String::new(),
            sort_by: "stars",
        };
    }

    SearchRequest {
        request_query: query.to_string(),
        response_query: query.to_string(),
        sort_by: "recent",
    }
}

fn parse_search_response(
    payload: Value,
    query: String,
    page: u32,
    limit: u32,
    duration_ms: u128,
) -> Result<MarketplaceSearchResponse, String> {
    let Some(skills_array) = extract_skills_array(&payload) else {
        return Err("SkillsMP no devolvio una lista de skills reconocible.".to_string());
    };

    let skills = skills_array
        .iter()
        .filter_map(parse_marketplace_skill)
        .collect::<Vec<_>>();

    Ok(MarketplaceSearchResponse {
        total: extract_total(&payload).or(Some(skills.len() as u64)),
        skills,
        query,
        page,
        limit,
        duration_ms,
    })
}

fn extract_skills_array(payload: &Value) -> Option<&Vec<Value>> {
    payload
        .get("skills")
        .and_then(Value::as_array)
        .or_else(|| payload.get("results").and_then(Value::as_array))
        .or_else(|| payload.pointer("/data/skills").and_then(Value::as_array))
        .or_else(|| payload.pointer("/data/results").and_then(Value::as_array))
        .or_else(|| payload.pointer("/data/items").and_then(Value::as_array))
        .or_else(|| payload.pointer("/data").and_then(Value::as_array))
        .or_else(|| payload.as_array())
}

fn extract_total(payload: &Value) -> Option<u64> {
    [
        payload.get("total"),
        payload.pointer("/pagination/total"),
        payload.pointer("/meta/total"),
        payload.pointer("/data/total"),
        payload.pointer("/count"),
    ]
    .into_iter()
    .flatten()
    .find_map(read_u64)
}

fn parse_marketplace_skill(skill: &Value) -> Option<MarketplaceSkill> {
    let name = read_first_string(skill, &["name", "title", "skillName", "skill_name", "slug"])?;
    let repository = read_first_string(skill, &["repository", "repo", "fullName", "full_name"])
        .or_else(|| read_nested_string(skill, &["github", "repository"]))
        .unwrap_or_else(|| "unknown/unknown".to_string());
    let author = read_first_string(skill, &["author", "owner"])
        .or_else(|| read_nested_string(skill, &["author", "login"]))
        .or_else(|| read_nested_string(skill, &["owner", "login"]))
        .unwrap_or_else(|| {
            repository
                .split('/')
                .next()
                .unwrap_or("unknown")
                .to_string()
        });
    let slug = read_first_string(skill, &["slug"]).unwrap_or_else(|| slugify(&name));
    let id =
        read_first_string(skill, &["id", "uuid"]).unwrap_or_else(|| format!("{repository}:{slug}"));
    let summary = read_first_string(skill, &["summary", "description", "excerpt", "tagline"])
        .unwrap_or_else(|| DEFAULT_SUMMARY.to_string());
    let stars = [
        skill.get("stars"),
        skill.get("starCount"),
        skill.get("stargazersCount"),
        skill.pointer("/github/stars"),
    ]
    .into_iter()
    .flatten()
    .find_map(read_u64);
    let updated_at = read_first_string(
        skill,
        &["updatedAt", "updated_at", "lastUpdated", "pushedAt"],
    )
    .or_else(|| read_nested_string(skill, &["github", "updatedAt"]));
    let url = read_first_string(skill, &["url", "htmlUrl", "html_url"])
        .or_else(|| read_nested_string(skill, &["github", "url"]));
    let github_url = read_first_string(skill, &["githubUrl"])
        .or_else(|| read_nested_string(skill, &["github", "url"]))
        .or_else(|| read_nested_string(skill, &["github", "treeUrl"]));
    let skill_url = read_first_string(skill, &["skillUrl"]).or(url);

    Some(MarketplaceSkill {
        id,
        slug,
        name,
        summary,
        repository,
        author,
        stars,
        updated_at,
        github_url,
        skill_url,
    })
}

fn read_first_string(value: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .filter_map(|key| value.get(*key))
        .find_map(read_string)
}

fn read_nested_string(value: &Value, path: &[&str]) -> Option<String> {
    let mut current = value;

    for segment in path {
        current = current.get(*segment)?;
    }

    read_string(current)
}

fn read_string(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => {
            let trimmed = text.trim();
            (!trimmed.is_empty()).then(|| trimmed.to_string())
        }
        Value::Number(number) => Some(number.to_string()),
        _ => None,
    }
}

fn read_u64(value: &Value) -> Option<u64> {
    match value {
        Value::Number(number) => number.as_u64(),
        Value::String(text) => text.trim().parse().ok(),
        _ => None,
    }
}

fn slugify(value: &str) -> String {
    value
        .chars()
        .map(|character| match character {
            'A'..='Z' => character.to_ascii_lowercase(),
            'a'..='z' | '0'..='9' => character,
            _ => '-',
        })
        .collect()
}

fn map_request_error(error: reqwest::Error) -> String {
    if error.is_timeout() {
        return "SkillsMP tardo demasiado en responder.".to_string();
    }

    "No se pudo conectar con SkillsMP.".to_string()
}

fn map_api_error(status: u16, payload: &Value) -> String {
    let error_code = payload
        .pointer("/error/code")
        .and_then(Value::as_str)
        .unwrap_or_default();

    match (status, error_code) {
        (401, "INVALID_API_KEY") => "La API key de SkillsMP no es valida.".to_string(),
        (401, "MISSING_API_KEY") => "La API key de SkillsMP no fue enviada.".to_string(),
        (401, _) => "No se pudo autenticar con SkillsMP.".to_string(),
        (429, "DAILY_QUOTA_EXCEEDED") => "La cuota diaria de SkillsMP se ha agotado.".to_string(),
        (429, _) => "SkillsMP ha bloqueado temporalmente las consultas por cuota.".to_string(),
        (400, "MISSING_QUERY") => {
            "Debes escribir una busqueda para consultar SkillsMP.".to_string()
        }
        (500, _) => "SkillsMP devolvio un error interno.".to_string(),
        _ => "SkillsMP devolvio un error inesperado.".to_string(),
    }
}

fn resolve_install_root(target: &str, collection: Option<&[String]>) -> Result<PathBuf, String> {
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

    if let Some(segments) = collection {
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

        if !value.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.')
        }) {
            return Err(
                "La coleccion solo puede usar letras, numeros, '-', '_' y '.'.".to_string(),
            );
        }

        segments.push(value.to_string());
    }

    Ok(Some(segments))
}

fn build_marketplace_install_metadata(
    skill: &MarketplaceSkill,
    target: &str,
    collection: Option<&str>,
    installed_path: &Path,
    existing: Option<&MarketplaceInstallMetadata>,
) -> MarketplaceInstallMetadata {
    MarketplaceInstallMetadata {
        skill_id: Some(skill.id.clone()),
        slug: skill.slug.clone(),
        name: skill.name.clone(),
        github_url: skill.github_url.clone(),
        skill_url: skill.skill_url.clone(),
        remote_updated_at: skill.updated_at.clone(),
        install_target: Some(target.to_string()),
        install_collection: collection.map(str::to_string),
        installed_at: existing
            .map(|value| value.installed_at.clone())
            .unwrap_or_else(now_timestamp_string),
        installed_path: installed_path.to_string_lossy().into_owned(),
        installer: MARKETPLACE_INSTALLER_ID.to_string(),
    }
}

fn write_marketplace_install_metadata(
    root_path: &Path,
    metadata: &MarketplaceInstallMetadata,
) -> Result<(), String> {
    let metadata_path = root_path.join(MARKETPLACE_INSTALL_METADATA_FILE_NAME);
    let content = serde_json::to_string_pretty(metadata)
        .map_err(|_| "No se pudo serializar la metadata de la skill instalada.".to_string())?;

    fs::write(metadata_path, content)
        .map_err(|_| "No se pudo guardar la metadata del marketplace.".to_string())
}

fn read_marketplace_install_metadata(root_path: &Path) -> Option<MarketplaceInstallMetadata> {
    let metadata_path = root_path.join(MARKETPLACE_INSTALL_METADATA_FILE_NAME);
    let content = fs::read_to_string(metadata_path).ok()?;

    serde_json::from_str(&content).ok()
}

fn build_temporary_skill_root(parent_root: &Path, slug: &str, suffix: &str) -> PathBuf {
    parent_root.join(format!(".{slug}-{suffix}-{}", now_timestamp_string()))
}

fn replace_directory_atomically(
    temp_root: &Path,
    final_root: &Path,
    backup_root: &Path,
) -> Result<(), String> {
    if backup_root.exists() {
        let _ = fs::remove_dir_all(backup_root);
    }

    fs::rename(final_root, backup_root).map_err(|_| {
        "No se pudo preparar la carpeta actual para actualizar la skill.".to_string()
    })?;

    if let Err(_) = fs::rename(temp_root, final_root) {
        let _ = fs::remove_dir_all(final_root);
        let _ = fs::rename(backup_root, final_root);
        return Err("No se pudo reemplazar la skill instalada con la nueva version.".to_string());
    }

    let _ = fs::remove_dir_all(backup_root);
    Ok(())
}

fn now_timestamp_string() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

#[derive(Debug, PartialEq, Eq)]
struct GitHubTreeReference {
    owner: String,
    repo: String,
    branch: String,
    path: String,
}

fn parse_github_tree_url(url: &str) -> Result<GitHubTreeReference, String> {
    let stripped = url
        .strip_prefix("https://github.com/")
        .or_else(|| url.strip_prefix("http://github.com/"))
        .ok_or_else(|| "La skill no apunta a una URL GitHub valida.".to_string())?;
    let segments = stripped.split('/').collect::<Vec<_>>();

    if segments.len() < 5 || segments[2] != "tree" {
        return Err("La URL GitHub de la skill no tiene el formato esperado.".to_string());
    }

    Ok(GitHubTreeReference {
        owner: segments[0].to_string(),
        repo: segments[1].to_string(),
        branch: segments[3].to_string(),
        path: segments[4..].join("/"),
    })
}

#[derive(Debug)]
struct GitHubEntry {
    entry_type: String,
    download_url: Option<String>,
    name: String,
    path: String,
}

impl MarketplaceService {
    fn fetch_github_file_text(
        &self,
        reference: &GitHubTreeReference,
        relative_path: &str,
    ) -> Result<String, String> {
        let full_path = if relative_path.is_empty() {
            reference.path.clone()
        } else {
            format!("{}/{}", reference.path, relative_path)
        };

        let response = self
            .client
            .get(format!(
                "{}/{}/{}/contents/{}",
                GITHUB_API_ROOT, reference.owner, reference.repo, full_path
            ))
            .header("User-Agent", USER_AGENT)
            .query(&[("ref", reference.branch.as_str())])
            .send()
            .and_then(|response| response.error_for_status())
            .map_err(|_| "No se pudo localizar SKILL.md en GitHub.".to_string())?;

        let payload: Value = response
            .json()
            .map_err(|_| "GitHub devolvio un contenido no valido para SKILL.md.".to_string())?;
        let download_url = payload
            .get("download_url")
            .and_then(Value::as_str)
            .ok_or_else(|| "GitHub no devolvio una URL valida para SKILL.md.".to_string())?;

        self.client
            .get(download_url)
            .header("User-Agent", USER_AGENT)
            .send()
            .and_then(|response| response.error_for_status())
            .map_err(|_| "No se pudo descargar SKILL.md desde GitHub.".to_string())?
            .text()
            .map_err(|_| "No se pudo leer el contenido de SKILL.md.".to_string())
    }

    fn download_directory(
        &self,
        reference: &GitHubTreeReference,
        output_root: &Path,
        current_relative: &str,
    ) -> Result<usize, String> {
        let entries = self.fetch_github_directory(reference, current_relative)?;
        let mut file_count = 0usize;

        for entry in entries {
            match entry.entry_type.as_str() {
                "file" => {
                    let download_url = entry.download_url.as_deref().ok_or_else(|| {
                        "GitHub no devolvio una URL de descarga para un archivo.".to_string()
                    })?;
                    let relative_path = entry
                        .path
                        .strip_prefix(&reference.path)
                        .map(|value| value.trim_start_matches('/'))
                        .unwrap_or(entry.path.as_str());
                    let destination = output_root.join(to_relative_path_buf(relative_path));
                    if let Some(parent) = destination.parent() {
                        fs::create_dir_all(parent)
                            .map_err(|_| "No se pudo crear la carpeta de destino.".to_string())?;
                    }
                    let bytes = self
                        .client
                        .get(download_url)
                        .header("User-Agent", USER_AGENT)
                        .send()
                        .and_then(|response| response.error_for_status())
                        .map_err(|_| {
                            "No se pudo descargar un archivo de la skill desde GitHub.".to_string()
                        })?
                        .bytes()
                        .map_err(|_| {
                            "No se pudo leer un archivo descargado de la skill.".to_string()
                        })?;
                    fs::write(destination, bytes).map_err(|_| {
                        "No se pudo escribir un archivo de la skill instalada.".to_string()
                    })?;
                    file_count += 1;
                }
                "dir" => {
                    let next_relative = if current_relative.is_empty() {
                        entry.name.clone()
                    } else {
                        format!("{current_relative}/{}", entry.name)
                    };
                    file_count +=
                        self.download_directory(reference, output_root, &next_relative)?;
                }
                _ => {}
            }
        }

        Ok(file_count)
    }

    fn fetch_github_directory(
        &self,
        reference: &GitHubTreeReference,
        current_relative: &str,
    ) -> Result<Vec<GitHubEntry>, String> {
        let full_path = if current_relative.is_empty() {
            reference.path.clone()
        } else {
            format!("{}/{}", reference.path, current_relative)
        };

        let response = self
            .client
            .get(format!(
                "{}/{}/{}/contents/{}",
                GITHUB_API_ROOT, reference.owner, reference.repo, full_path
            ))
            .header("User-Agent", USER_AGENT)
            .query(&[("ref", reference.branch.as_str())])
            .send()
            .and_then(|response| response.error_for_status())
            .map_err(|_| "No se pudo consultar el contenido de la skill en GitHub.".to_string())?;

        let payload: Value = response
            .json()
            .map_err(|_| "GitHub devolvio un contenido no valido para la skill.".to_string())?;
        let entries = payload
            .as_array()
            .ok_or_else(|| "GitHub no devolvio una carpeta valida para esta skill.".to_string())?;

        Ok(entries
            .iter()
            .filter_map(|entry| {
                Some(GitHubEntry {
                    entry_type: entry.get("type")?.as_str()?.to_string(),
                    download_url: entry
                        .get("download_url")
                        .and_then(Value::as_str)
                        .map(str::to_string),
                    name: entry.get("name")?.as_str()?.to_string(),
                    path: entry.get("path")?.as_str()?.to_string(),
                })
            })
            .collect())
    }
}

fn to_relative_path_buf(value: &str) -> PathBuf {
    let mut path = PathBuf::new();

    for segment in value.split('/').filter(|segment| !segment.is_empty()) {
        path.push(segment);
    }

    path
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    use serde_json::json;

    use super::{
        build_marketplace_install_metadata, build_search_request, normalize_install_collection,
        parse_github_tree_url, parse_search_response, read_marketplace_install_metadata,
        replace_directory_atomically, resolve_install_root, MarketplaceSkill,
    };

    #[test]
    fn parse_search_response_supports_skills_array_shape() {
        let payload = json!({
            "skills": [
                {
                    "id": "skill_123",
                    "slug": "api-changelog-versioning",
                    "name": "API Changelog & Versioning",
                    "summary": "Document API changes cleanly.",
                    "repository": "aj-geddes/useful-ai-prompts-skills",
                    "author": "aj-geddes",
                    "stars": 132,
                    "updatedAt": "2026-03-04T07:30:00Z",
                    "githubUrl": "https://github.com/aj-geddes/useful-ai-prompts-skills/tree/main/skills/api",
                    "skillUrl": "https://skillsmp.com/skills/example"
                }
            ],
            "total": 695541
        });

        let response = parse_search_response(payload, "api".to_string(), 1, 20, 12)
            .expect("response should parse");

        assert_eq!(response.skills.len(), 1);
        assert_eq!(response.total, Some(695541));
        assert_eq!(
            response.skills[0].repository,
            "aj-geddes/useful-ai-prompts-skills"
        );
        assert_eq!(
            response.skills[0].github_url.as_deref(),
            Some("https://github.com/aj-geddes/useful-ai-prompts-skills/tree/main/skills/api")
        );
    }

    #[test]
    fn parse_search_response_supports_nested_data_results_shape() {
        let payload = json!({
            "data": {
                "results": [
                    {
                        "title": "Install",
                        "description": "Install an external skill.",
                        "repo": "nickdirienzo/nonnaclaw",
                        "owner": { "login": "nickdirienzo" },
                        "starCount": "3"
                    }
                ]
            },
            "meta": {
                "total": 1
            }
        });

        let response = parse_search_response(payload, "install".to_string(), 1, 20, 5)
            .expect("response should parse");

        assert_eq!(response.skills[0].name, "Install");
        assert_eq!(response.skills[0].author, "nickdirienzo");
        assert_eq!(response.skills[0].stars, Some(3));
    }

    #[test]
    fn parse_github_tree_url_supports_tree_paths() {
        let reference = parse_github_tree_url(
            "https://github.com/pinkpixel-dev/skills-collection/tree/main/SKILLS/rust-pro",
        )
        .expect("github url should parse");

        assert_eq!(reference.owner, "pinkpixel-dev");
        assert_eq!(reference.repo, "skills-collection");
        assert_eq!(reference.branch, "main");
        assert_eq!(reference.path, "SKILLS/rust-pro");
    }

    #[test]
    fn resolve_install_root_supports_workspace_target() {
        let root =
            resolve_install_root("workspace", None).expect("workspace target should resolve");

        assert!(root.to_string_lossy().contains(".agents"));
        assert!(root.to_string_lossy().contains("skills"));
    }

    #[test]
    fn resolve_install_root_appends_collection_segments() {
        let collection = vec!["team".to_string(), "marketplace".to_string()];
        let root = resolve_install_root("workspace", Some(&collection))
            .expect("workspace target with collection should resolve");

        assert!(root.to_string_lossy().contains(".agents"));
        assert!(root.to_string_lossy().contains("team"));
        assert!(root.to_string_lossy().contains("marketplace"));
    }

    #[test]
    fn normalize_install_collection_rejects_parent_segments() {
        let error = normalize_install_collection(Some("../private"))
            .expect_err("parent segments should be rejected");

        assert_eq!(error, "La coleccion de instalacion no es valida.");
    }

    #[test]
    fn build_search_request_uses_featured_defaults_for_empty_query() {
        let request = build_search_request("");

        assert_eq!(request.request_query, "skill");
        assert_eq!(request.response_query, "");
        assert_eq!(request.sort_by, "stars");
    }

    #[test]
    fn build_search_request_preserves_user_query() {
        let request = build_search_request("rust");

        assert_eq!(request.request_query, "rust");
        assert_eq!(request.response_query, "rust");
        assert_eq!(request.sort_by, "recent");
    }

    #[test]
    fn build_marketplace_install_metadata_keeps_existing_install_timestamp() {
        let skill = sample_marketplace_skill();
        let installed_path = PathBuf::from("C:/skills/example-skill");
        let existing = super::MarketplaceInstallMetadata {
            skill_id: Some("skill_123".to_string()),
            slug: "example-skill".to_string(),
            name: "Example Skill".to_string(),
            github_url: Some(
                "https://github.com/example/repo/tree/main/skills/example".to_string(),
            ),
            skill_url: Some("https://skillsmp.com/skills/example".to_string()),
            remote_updated_at: Some("1710000000".to_string()),
            install_target: Some("codex".to_string()),
            install_collection: Some("team/tools".to_string()),
            installed_at: "1700000000".to_string(),
            installed_path: installed_path.to_string_lossy().into_owned(),
            installer: "skills-ide".to_string(),
        };

        let metadata = build_marketplace_install_metadata(
            &skill,
            "codex",
            Some("team/tools"),
            &installed_path,
            Some(&existing),
        );

        assert_eq!(metadata.installed_at, "1700000000");
        assert_eq!(metadata.remote_updated_at.as_deref(), Some("1712345678"));
        assert_eq!(metadata.install_collection.as_deref(), Some("team/tools"));
    }

    #[test]
    fn read_marketplace_install_metadata_round_trips_written_file() {
        let workspace = TestWorkspace::new("marketplace_metadata");
        let skill = sample_marketplace_skill();
        let installed_root = workspace.path.join("example-skill");
        fs::create_dir_all(&installed_root).expect("should create installed root");

        let metadata = build_marketplace_install_metadata(
            &skill,
            "workspace",
            Some("team"),
            &installed_root,
            None,
        );
        super::write_marketplace_install_metadata(&installed_root, &metadata)
            .expect("metadata should be written");

        let parsed =
            read_marketplace_install_metadata(&installed_root).expect("metadata should parse");

        assert_eq!(parsed.skill_id.as_deref(), Some("skill_123"));
        assert_eq!(parsed.install_target.as_deref(), Some("workspace"));
        assert_eq!(parsed.install_collection.as_deref(), Some("team"));
        assert_eq!(parsed.installed_path, installed_root.to_string_lossy());
    }

    #[test]
    fn replace_directory_atomically_restores_original_directory_when_swap_fails() {
        let workspace = TestWorkspace::new("marketplace_replace");
        let final_root = workspace.path.join("installed-skill");
        let backup_root = workspace.path.join(".installed-skill-backup");
        let missing_temp_root = workspace.path.join(".installed-skill-update");

        fs::create_dir_all(&final_root).expect("should create existing directory");
        fs::write(final_root.join("SKILL.md"), "# Original\n")
            .expect("should write original manifest");

        let error = replace_directory_atomically(&missing_temp_root, &final_root, &backup_root)
            .expect_err("missing replacement directory should fail");

        assert_eq!(
            error,
            "No se pudo reemplazar la skill instalada con la nueva version."
        );
        assert!(final_root.exists());
        assert!(final_root.join("SKILL.md").exists());
        assert!(!backup_root.exists());
    }

    fn sample_marketplace_skill() -> MarketplaceSkill {
        MarketplaceSkill {
            id: "skill_123".to_string(),
            slug: "example-skill".to_string(),
            name: "Example Skill".to_string(),
            summary: "Example summary".to_string(),
            repository: "example/repo".to_string(),
            author: "example".to_string(),
            stars: Some(42),
            updated_at: Some("1712345678".to_string()),
            github_url: Some(
                "https://github.com/example/repo/tree/main/skills/example".to_string(),
            ),
            skill_url: Some("https://skillsmp.com/skills/example".to_string()),
        }
    }

    struct TestWorkspace {
        path: PathBuf,
    }

    impl TestWorkspace {
        fn new(prefix: &str) -> Self {
            let unique_suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system time should be after unix epoch")
                .as_nanos();
            let path = std::env::temp_dir()
                .join(format!("skills_ide_marketplace_{prefix}_{unique_suffix}"));

            fs::create_dir_all(&path).expect("should create temporary workspace");

            Self { path }
        }
    }

    impl Drop for TestWorkspace {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }
}
