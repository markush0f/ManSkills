mod details;
mod styles;

use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph},
};
use skills_core::SystemSkill;

use crate::app::{App, InputMode};
use styles::source_color;

pub(crate) fn render(frame: &mut ratatui::Frame<'_>, app: &App) {
    let area = frame.area();
    if area.width < 50 || area.height < 14 {
        render_compact(frame, app, area);
        return;
    }

    let root = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(4),
            Constraint::Length(3),
            Constraint::Min(8),
            Constraint::Length(4),
        ])
        .split(area);

    render_header(frame, app, root[0]);
    render_input_bar(frame, app, root[1]);

    let body = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(42), Constraint::Percentage(58)])
        .split(root[2]);

    render_skills(frame, app, body[0]);
    details::render(frame, app, body[1]);
    render_footer(frame, app, root[3]);
}

fn render_compact(frame: &mut ratatui::Frame<'_>, app: &App, area: Rect) {
    let compact = Paragraph::new(vec![
        Line::from(Span::styled(
            "Skills IDE TUI",
            Style::default()
                .fg(Color::Rgb(125, 211, 252))
                .add_modifier(Modifier::BOLD),
        )),
        Line::from("Terminal is too small. Make it wider/taller."),
        Line::from(Span::styled(
            app.status.clone(),
            Style::default().fg(Color::Rgb(134, 239, 172)),
        )),
        Line::from("q quits"),
    ])
    .block(
        Block::default()
            .title(" Skills ")
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Rgb(56, 189, 248))),
    );

    frame.render_widget(compact, area);
}

fn render_header(frame: &mut ratatui::Frame<'_>, app: &App, area: Rect) {
    let roots = if app.roots.is_empty() {
        "all default OS directories".to_string()
    } else {
        format!("{} custom directories", app.roots.len())
    };

    let header = Paragraph::new(vec![
        Line::from(vec![
            Span::styled(
                "Skills IDE TUI",
                Style::default()
                    .fg(Color::Rgb(125, 211, 252))
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("  "),
            Span::styled(
                "browse, filter and inspect local agent skills",
                Style::default().fg(Color::Rgb(192, 132, 252)),
            ),
        ]),
        Line::from(vec![
            Span::styled(
                format!(
                    "{} / {} visible",
                    app.filtered_skills.len(),
                    app.skills.len()
                ),
                Style::default().fg(Color::Rgb(134, 239, 172)),
            ),
            Span::raw("  |  Roots: "),
            Span::styled(roots, Style::default().fg(Color::Rgb(253, 224, 71))),
            Span::raw("  |  Scanned: "),
            Span::styled(
                app.scanned_roots.len().to_string(),
                Style::default().fg(Color::Rgb(253, 186, 116)),
            ),
        ]),
    ])
    .alignment(Alignment::Center)
    .block(
        Block::default()
            .title(" Agent Skills ")
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Rgb(56, 189, 248))),
    );

    frame.render_widget(header, area);
}

fn render_input_bar(frame: &mut ratatui::Frame<'_>, app: &App, area: Rect) {
    let (title, value, border_color) = match app.mode {
        InputMode::Search => (
            " Search / Buscar ",
            format!("/{}", app.search),
            Color::Rgb(34, 211, 238),
        ),
        InputMode::Roots => (
            " Directories / Directorios ",
            if app.root_input.is_empty() {
                "empty = all default OS directories".to_string()
            } else {
                app.root_input.clone()
            },
            Color::Rgb(251, 191, 36),
        ),
        InputMode::Normal => (
            " Filter ",
            if app.search.is_empty() {
                "Press / to search skills, d to change scan directories".to_string()
            } else {
                format!("Active search: {}  (press c to clear)", app.search)
            },
            Color::Rgb(99, 102, 241),
        ),
    };

    let input = Paragraph::new(Line::from(Span::styled(
        value,
        Style::default().fg(Color::Rgb(226, 232, 240)).add_modifier(
            if app.mode == InputMode::Normal {
                Modifier::empty()
            } else {
                Modifier::BOLD
            },
        ),
    )))
    .block(
        Block::default()
            .title(title)
            .borders(Borders::ALL)
            .border_style(Style::default().fg(border_color)),
    );

    frame.render_widget(input, area);
}

fn render_skills(frame: &mut ratatui::Frame<'_>, app: &App, area: Rect) {
    let mut list_state = ListState::default();
    if !app.filtered_skills.is_empty() {
        list_state.select(Some(app.selected));
    }

    let items = app
        .filtered_skills
        .iter()
        .filter_map(|skill_index| app.skills.get(*skill_index))
        .map(skill_list_item)
        .collect::<Vec<_>>();

    let list = List::new(items)
        .block(
            Block::default()
                .title(format!(
                    " Skills {}/{} ",
                    app.filtered_skills.len(),
                    app.skills.len()
                ))
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Rgb(45, 212, 191))),
        )
        .highlight_style(
            Style::default()
                .fg(Color::Rgb(15, 23, 42))
                .bg(Color::Rgb(103, 232, 249))
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("> ");

    frame.render_stateful_widget(list, area, &mut list_state);
}

fn render_footer(frame: &mut ratatui::Frame<'_>, app: &App, area: Rect) {
    let help = match app.mode {
        InputMode::Normal => "Up/Down j/k move | PgUp/PgDn jump | Home/End edges | / search | d directories | r refresh | q quit",
        InputMode::Search => "Typing filters immediately | Up/Down move results | Backspace delete | Enter/Esc return",
        InputMode::Roots => "Separate directories with ; | Empty scans all default OS directories | Enter apply | Esc cancel",
    };
    let status_style = if app.status.starts_with("Error:") {
        Style::default().fg(Color::Rgb(248, 113, 113))
    } else {
        Style::default().fg(Color::Rgb(134, 239, 172))
    };

    let footer = Paragraph::new(vec![
        Line::from(Span::styled(app.status.clone(), status_style)),
        Line::from(Span::styled(
            help,
            Style::default().fg(Color::Rgb(203, 213, 225)),
        )),
    ])
    .alignment(Alignment::Center)
    .block(
        Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Rgb(71, 85, 105))),
    );

    frame.render_widget(footer, area);
}

fn skill_list_item(skill: &SystemSkill) -> ListItem<'static> {
    ListItem::new(vec![
        Line::from(vec![
            Span::styled(
                skill.name.clone(),
                Style::default()
                    .fg(Color::Rgb(226, 232, 240))
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("  "),
            Span::styled(
                format!("[{}]", skill.source),
                Style::default().fg(source_color(&skill.source)),
            ),
        ]),
        Line::from(Span::styled(
            truncate(&skill.summary, 92),
            Style::default().fg(Color::Rgb(148, 163, 184)),
        )),
    ])
}

fn truncate(value: &str, max_chars: usize) -> String {
    if value.chars().count() <= max_chars {
        return value.to_string();
    }

    let mut truncated = value
        .chars()
        .take(max_chars.saturating_sub(3))
        .collect::<String>();
    truncated.push_str("...");
    truncated
}

#[cfg(test)]
mod tests {
    use super::truncate;

    #[test]
    fn truncate_should_keep_short_values_unchanged() {
        assert_eq!(truncate("short", 10), "short");
    }
}
