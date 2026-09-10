#[derive(Debug, Clone, Default)]
pub struct Exclusions {
    pub app_names: Vec<String>,
    pub title_patterns: Vec<String>,
}

fn glob_to_matches(pattern: &str, haystack: &str) -> bool {
    let pattern = pattern.to_lowercase();
    let haystack = haystack.to_lowercase();
    if !pattern.contains('*') && !pattern.contains('?') {
        return haystack.contains(&pattern);
    }
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 1 {
        return haystack == pattern;
    }
    let mut cursor = 0usize;
    for (index, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        match haystack[cursor..].find(part) {
            Some(found) => {
                let absolute = cursor + found;
                if index == 0 && absolute != 0 {
                    return false;
                }
                cursor = absolute + part.len();
            }
            None => return false,
        }
    }
    let last = parts.last().unwrap_or(&"");
    last.is_empty() || haystack.ends_with(last)
}

fn matches_any(value: &str, patterns: &[String]) -> bool {
    patterns.iter().any(|pattern| glob_to_matches(pattern, value))
}

impl Exclusions {
    pub fn is_excluded(&self, app_name: Option<&str>, window_title: Option<&str>) -> bool {
        if let Some(app_name) = app_name {
            if matches_any(app_name, &self.app_names) {
                return true;
            }
        }
        if let Some(window_title) = window_title {
            if matches_any(window_title, &self.title_patterns) {
                return true;
            }
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_plain_substring_case_insensitively() {
        let exclusions = Exclusions {
            app_names: vec!["1password".to_string()],
            title_patterns: vec![],
        };
        assert!(exclusions.is_excluded(Some("1Password"), None));
        assert!(!exclusions.is_excluded(Some("Firefox"), None));
    }

    #[test]
    fn matches_wildcard_title_pattern() {
        let exclusions = Exclusions {
            app_names: vec![],
            title_patterns: vec!["*online banking*".to_string()],
        };
        assert!(exclusions.is_excluded(
            Some("Firefox"),
            Some("My Online Banking - Accounts")
        ));
        assert!(!exclusions.is_excluded(Some("Firefox"), Some("Docs - MDN")));
    }
}
