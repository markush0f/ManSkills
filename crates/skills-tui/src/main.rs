use std::{io, time::Duration};

use clap::Parser;
use crossterm::{
    event::{self, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph, Wrap},
    Terminal,
};
use skills_core::{SkillService, SystemSkill, SystemSkillTreeFile};

#[derive(Parser)]
#[command(name = "skills-tui")]
#[command(about = "Browse local agent skills in the terminal")]
struct Args {
    #[arg(long = "root")]
    roots: Vec<String>,
}

struct App {
    roots: Vec<String>,
    skills: Vec<SystemSkill>,
    files: Vec<SystemSkillTreeFile>,
    selected: usize,
    status: String,
}

impl App {
    fn new(roots: Vec<String>) -> Self {
        Self {
            roots,
            skills: Vec::new(),
            files: Vec::new(),
            selected: 0,
            status: "Loading skills...".to_string(),
        }
    }

    fn refresh(&mut self) {
        let service = SkillService::new();
        match service.scan(optional_roots(self.roots.clone())) {
            Ok(response) => {
                self.skills = response.skills;
                if self.selected >= self.skills.len() {
                    self.selected = self.skills.len().saturating_sub(1);
                }
                self.status = format!(
                    "{} skills found in {} ms",
                    self.skills.len(), response.duration_ms
                );
                self.load_selected_files();
            }
            Err(error) => {
                self.skills.clear();
                self.files.clear();
                self.selected = 0;
                self.status = error;
            }
        }
    }

    fn select_next(&mut self) {
        if self.skills.is_empty() {
            return;
        }
        self.selected = (self.selected + 1).min(self.skills.len() - 1);
        self.load_selected_files();
    }

    fn select_previous(&mut self) {
        if self.skills.is_empty() {
            return;
        }
        self.selected = self.selected.saturating_sub(1);
        self.load_selected_files();
    }

    fn selected_skill(&self) -> Option<&SystemSkill> {
        self.skills.get(self.selected)
    }

    fn load_selected_files(&mut self) {
        let Some(root_path) = self.selected_skill().map(|skill| skill.root_path.clone()) else {
            self.files.clear();
            return;
        };

        match SkillService::new().list_from_root(root_path) {
            Ok(files) => self.files = files,
            Err(error) => {
                self.files.clear();
                self.status = error;
            }
        }
    }
}

fn main() -> Result<(), String> {
    let args = Args::parse();
    run(args.roots)
}

fn run(roots: Vec<String>) -> Result<(), String> {
    enable_raw_mode().map_err(|error| format!("Failed to enable raw mode: {error}"))?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)
        .map_err(|error| format!("Failed to enter alternate screen: {error}"))?;

    let mut terminal = Terminal::new(ratatui::backend::CrosstermBackend::new(stdout))
        .map_err(|error| format!("Failed to create terminal: {error}"))?;

    let mut app = App::new(roots);
    app.refresh();
    let result = run_app(&mut terminal, &mut app);

    disable_raw_mode().map_err(|error| format!("Failed to disable raw mode: {error}"))?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)
        .map_err(|error| format!("Failed to leave alternate screen: {error}"))?;

    result
}

fn run_app<B>(terminal: &mut Terminal<B>, app: &mut App) -> Result<(), String>
where
    B: ratatui::backend::Backend,
{
    loop {
        terminal
            .draw(|frame| render(frame, app))
            .map_err(|error| format!("Failed to draw terminal: {error}"))?;

        if !event::poll(Duration::from_millis(200))
            .map_err(|error| format!("Failed to poll terminal events: {error}"))?
        {
            continue;
        }

        let Event::Key(key) = event::read()
            .map_err(|error| format!("Failed to read terminal event: {error}"))?
        else {
            continue;
        };

        match key.code {
            KeyCode::Char('q') | KeyCode::Esc => return Ok(()),
            KeyCode::Char('r') => app.refresh(),
            KeyCode::Down | KeyCode::Char('j') => app.select_next(),
            KeyCode::Up | KeyCode::Char('k') => app.select_previous(),
            _ => {}
        }
    }
}

fn render(frame: &mut ratatui::Frame<'_>, app: &App) {
    let root = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(3)])
        .split(frame.area());

    let body = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(38), Constraint::Percentage(62)])
        .split(root[0]);

    let mut list_state = ListState::default();
    if !app.skills.is_empty() {
        list_state.select(Some(app.selected));
    }

    let skills = app
        .skills
        .iter()
        .map(|skill| ListItem::new(format!("{}  {}", skill.name, skill.source)))
        .collect::<Vec<_>>();

    let list = List::new(skills)
        .block(Block::default().title("Skills").borders(Borders::ALL))
        .highlight_style(
            Style::default()
                .fg(Color::Black)
                .bg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("> ");

    frame.render_stateful_widget(list, body[0], &mut list_state);

    let details = selected_details(app);
    let details = Paragraph::new(details)
        .block(Block::default().title("Details").borders(Borders::ALL))
        .wrap(Wrap { trim: false });
    frame.render_widget(details, body[1]);

    let help = Paragraph::new(format!(
        "{} | Up/Down or j/k move | r refresh | q quit",
        app.status
    ))
    .block(Block::default().borders(Borders::ALL));
    frame.render_widget(help, root[1]);
}

fn selected_details(app: &App) -> Vec<Line<'static>> {
    let Some(skill) = app.selected_skill() else {
        return vec![Line::from("No skills found.")];
    };

    let mut lines = vec![
        Line::from(vec![Span::styled(
            skill.name.clone(),
            Style::default().add_modifier(Modifier::BOLD),
        )]),
        Line::from(""),
        Line::from(skill.summary.clone()),
        Line::from(""),
        Line::from(format!("Slug: {}", skill.slug)),
        Line::from(format!("Source: {}", skill.source)),
        Line::from(format!("Root: {}", skill.root_path)),
        Line::from(format!("Manifest: {}", skill.manifest_path)),
    ];

    if let Some(git_root) = &skill.git_repository_root_path {
        lines.push(Line::from(format!("Git: {git_root}")));
    }

    lines.push(Line::from(""));
    lines.push(Line::from(vec![Span::styled(
        "Files",
        Style::default().add_modifier(Modifier::BOLD),
    )]));

    if app.files.is_empty() {
        lines.push(Line::from("No files found."));
    } else {
        lines.extend(
            app.files
                .iter()
                .take(18)
                .map(|file| Line::from(format!("{}  {}", file.language, file.relative_path))),
        );
        if app.files.len() > 18 {
            lines.push(Line::from(format!("... {} more", app.files.len() - 18)));
        }
    }

    lines
}

fn optional_roots(roots: Vec<String>) -> Option<Vec<String>> {
    if roots.is_empty() {
        None
    } else {
        Some(roots)
    }
}
