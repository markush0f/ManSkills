mod app;
mod events;
mod roots;
mod ui;

use std::io;

use app::App;
use clap::Parser;
use crossterm::{
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::Terminal;

#[derive(Parser)]
#[command(name = "skills-tui")]
#[command(about = "Browse local agent skills in the terminal")]
struct Args {
    #[arg(long = "root")]
    roots: Vec<String>,
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
    terminal
        .clear()
        .map_err(|error| format!("Failed to clear terminal: {error}"))?;

    let mut app = App::new(roots);
    app.refresh();
    let result = events::run_app(&mut terminal, &mut app);

    disable_raw_mode().map_err(|error| format!("Failed to disable raw mode: {error}"))?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)
        .map_err(|error| format!("Failed to leave alternate screen: {error}"))?;

    result
}
