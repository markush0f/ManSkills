use std::time::{Duration, Instant};

use reqwest::blocking::Client;
use serde_json::Value;

use crate::models::{MarketplaceSearchResponse, MarketplaceSkill};

const DEFAULT_LIMIT: u32 = 20;
const DEFAULT_PAGE: u32 = 1;
const MAX_LIMIT: u32 = 100;
const SEARCH_URL: &str = "https://skillsmp.com/api/v1/skills/search";
const API_KEY_ENV: &str = "SKILLSMP_API_KEY";
const DEFAULT_SUMMARY: &str = "No summary provided by SkillsMP.";

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

        if normalized_query.is_empty() {
            return Ok(MarketplaceSearchResponse {
                skills: Vec::new(),
                query: String::new(),
                page: normalized_page,
                limit: normalized_limit,
                total: Some(0),
                duration_ms: 0,
            });
        }

        let api_key = std::env::var(API_KEY_ENV)
            .map_err(|_| "Falta la variable de entorno SKILLSMP_API_KEY.".to_string())?;

        let response = self
            .client
            .get(SEARCH_URL)
            .bearer_auth(api_key)
            .query(&[
                ("q", normalized_query.as_str()),
                ("page", &normalized_page.to_string()),
                ("limit", &normalized_limit.to_string()),
                ("sortBy", "recent"),
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
            normalized_query,
            normalized_page,
            normalized_limit,
            started_at.elapsed().as_millis(),
        )
    }
}

impl Default for MarketplaceService {
    fn default() -> Self {
        Self::new()
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
    let name = read_first_string(
        skill,
        &["name", "title", "skillName", "skill_name", "slug"],
    )?;
    let repository = read_first_string(
        skill,
        &["repository", "repo", "fullName", "full_name"],
    )
    .or_else(|| read_nested_string(skill, &["github", "repository"]))
    .unwrap_or_else(|| "unknown/unknown".to_string());
    let author = read_first_string(skill, &["author", "owner"])
        .or_else(|| read_nested_string(skill, &["author", "login"]))
        .or_else(|| read_nested_string(skill, &["owner", "login"]))
        .unwrap_or_else(|| repository.split('/').next().unwrap_or("unknown").to_string());
    let slug = read_first_string(skill, &["slug"]).unwrap_or_else(|| slugify(&name));
    let id = read_first_string(skill, &["id", "uuid"]).unwrap_or_else(|| format!("{repository}:{slug}"));
    let summary = read_first_string(
        skill,
        &["summary", "description", "excerpt", "tagline"],
    )
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

    Some(MarketplaceSkill {
        id,
        slug,
        name,
        summary,
        repository,
        author,
        stars,
        updated_at,
        url,
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
    value.chars()
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
        (400, "MISSING_QUERY") => "Debes escribir una busqueda para consultar SkillsMP.".to_string(),
        (500, _) => "SkillsMP devolvio un error interno.".to_string(),
        _ => "SkillsMP devolvio un error inesperado.".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::parse_search_response;

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
                    "url": "https://skillsmp.com/skills/example"
                }
            ],
            "total": 695541
        });

        let response = parse_search_response(payload, "api".to_string(), 1, 20, 12)
            .expect("response should parse");

        assert_eq!(response.skills.len(), 1);
        assert_eq!(response.total, Some(695541));
        assert_eq!(response.skills[0].repository, "aj-geddes/useful-ai-prompts-skills");
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
}
