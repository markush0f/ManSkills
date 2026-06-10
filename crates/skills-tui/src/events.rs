use std::time::Duration;

use crossterm::event::{self, Event, KeyCode, KeyEventKind};
use ratatui::Terminal;

use crate::{
    app::{App, InputMode},
    ui::render,
};

pub(crate) fn run_app<B>(terminal: &mut Terminal<B>, app: &mut App) -> Result<(), String>
where
    B: ratatui::backend::Backend,
{
    loop {
        app.poll_scan();

        terminal
            .draw(|frame| render(frame, app))
            .map_err(|error| format!("Failed to draw terminal: {error}"))?;

        if !event::poll(Duration::from_millis(200))
            .map_err(|error| format!("Failed to poll terminal events: {error}"))?
        {
            continue;
        }

        let Event::Key(key) =
            event::read().map_err(|error| format!("Failed to read terminal event: {error}"))?
        else {
            continue;
        };

        if key.kind != KeyEventKind::Press {
            continue;
        }

        match app.mode {
            InputMode::Normal => match key.code {
                KeyCode::Char('q') | KeyCode::Esc => return Ok(()),
                KeyCode::Char('r') => app.refresh(),
                KeyCode::Char('/') => app.enter_search(),
                KeyCode::Char('d') => app.enter_roots(),
                KeyCode::Char('c') => app.clear_search(),
                KeyCode::Down | KeyCode::Char('j') => app.select_next(),
                KeyCode::Up | KeyCode::Char('k') => app.select_previous(),
                KeyCode::PageDown => app.page_down(),
                KeyCode::PageUp => app.page_up(),
                KeyCode::Home => app.select_first(),
                KeyCode::End => app.select_last(),
                _ => {}
            },
            InputMode::Search => match key.code {
                KeyCode::Enter | KeyCode::Esc => app.exit_input(),
                KeyCode::Backspace => app.pop_search_char(),
                KeyCode::Char(character) => app.push_search_char(character),
                KeyCode::Down => app.select_next(),
                KeyCode::Up => app.select_previous(),
                _ => {}
            },
            InputMode::Roots => match key.code {
                KeyCode::Enter => app.apply_roots(),
                KeyCode::Esc => app.exit_input(),
                KeyCode::Backspace => app.pop_root_char(),
                KeyCode::Char(character) => app.push_root_char(character),
                _ => {}
            },
        }
    }
}
