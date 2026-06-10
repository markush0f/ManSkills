use ratatui::{
    layout::Rect,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Wrap},
};

use crate::app::App;

pub(super) fn render(frame: &mut ratatui::Frame<'_>, app: &App, area: Rect) {
    let details = Paragraph::new(selected_details(app))
        .block(
            Block::default()
                .title(" Details / Detalles ")
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Rgb(168, 85, 247))),
        )
        .wrap(Wrap { trim: false });

    frame.render_widget(details, area);
}

pub(super) fn selected_details(app: &App) -> Vec<Line<'static>> {
    let Some(skill) = app.selected_skill() else {
        if app.search.trim().is_empty() {
            return vec![empty_line("No skills found in the active directories.")];
        }

        return vec![
            section_line("No Matches"),
            empty_line("No skills match the current search."),
            empty_line("Press c in normal mode to clear the filter, or / to edit it."),
        ];
    };

    let mut lines = vec![
        Line::from(vec![
            Span::styled(
                skill.name.clone(),
                Style::default()
                    .fg(Color::Rgb(125, 211, 252))
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("  "),
            Span::styled(
                format!("{} of {}", app.selected + 1, app.filtered_skills.len()),
                Style::default().fg(Color::Rgb(148, 163, 184)),
            ),
        ]),
        Line::from(""),
        section_line("Summary"),
        empty_line(&skill.summary),
        Line::from(""),
        section_line("Identity"),
        field_line("Slug", &skill.slug),
        field_line("Source", &skill.source),
        field_line("Root", &skill.root_path),
        field_line("Manifest", &skill.manifest_path),
    ];

    if let Some(git_root) = &skill.git_repository_root_path {
        lines.push(field_line("Git", git_root));
    }

    lines.push(Line::from(""));
    lines.push(section_line("Files"));
    lines.extend(file_lines(app));

    if !app.scanned_roots.is_empty() {
        lines.push(Line::from(""));
        lines.push(section_line("Scanned Roots"));
        lines.extend(
            app.scanned_roots
                .iter()
                .take(4)
                .map(|root| empty_line(root)),
        );

        if app.scanned_roots.len() > 4 {
            lines.push(empty_line(&format!(
                "... {} more roots",
                app.scanned_roots.len() - 4
            )));
        }
    }

    lines
}

fn file_lines(app: &App) -> Vec<Line<'static>> {
    if app.files.is_empty() {
        return vec![empty_line("No files found.")];
    }

    let mut lines = app
        .files
        .iter()
        .take(22)
        .map(|file| {
            Line::from(vec![
                Span::styled(
                    format!("{:>4}", file.language),
                    Style::default().fg(Color::Rgb(253, 186, 116)),
                ),
                Span::raw("  "),
                Span::styled(
                    file.relative_path.clone(),
                    Style::default().fg(Color::Rgb(226, 232, 240)),
                ),
            ])
        })
        .collect::<Vec<_>>();

    if app.files.len() > 22 {
        lines.push(empty_line(&format!(
            "... {} more files",
            app.files.len() - 22
        )));
    }

    lines
}

fn section_line(label: &str) -> Line<'static> {
    Line::from(Span::styled(
        label.to_string(),
        Style::default()
            .fg(Color::Rgb(192, 132, 252))
            .add_modifier(Modifier::BOLD),
    ))
}

fn field_line(label: &str, value: &str) -> Line<'static> {
    Line::from(vec![
        Span::styled(
            format!("{label}: "),
            Style::default()
                .fg(Color::Rgb(148, 163, 184))
                .add_modifier(Modifier::BOLD),
        ),
        Span::styled(
            value.to_string(),
            Style::default().fg(Color::Rgb(226, 232, 240)),
        ),
    ])
}

fn empty_line(value: &str) -> Line<'static> {
    Line::from(Span::styled(
        value.to_string(),
        Style::default().fg(Color::Rgb(203, 213, 225)),
    ))
}
