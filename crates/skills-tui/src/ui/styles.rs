use ratatui::style::Color;

pub(super) fn source_color(source: &str) -> Color {
    match source {
        "workspace" => Color::Rgb(74, 222, 128),
        "managed" => Color::Rgb(96, 165, 250),
        "system" => Color::Rgb(251, 191, 36),
        _ => Color::Rgb(203, 213, 225),
    }
}
