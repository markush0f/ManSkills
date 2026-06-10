pub(crate) fn parse_roots(value: &str) -> Vec<String> {
    value
        .split([';', ',', '\n'])
        .map(str::trim)
        .filter(|root| !root.is_empty())
        .map(ToString::to_string)
        .collect()
}

pub(crate) fn optional_roots(roots: Vec<String>) -> Option<Vec<String>> {
    if roots.is_empty() {
        None
    } else {
        Some(roots)
    }
}
