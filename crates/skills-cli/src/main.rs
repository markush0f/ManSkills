use clap::{Parser, Subcommand};
use serde::Serialize;
use skills_core::SkillService;

#[derive(Parser)]
#[command(name = "skills")]
#[command(about = "Detect and inspect local agent skills")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Scan {
        #[arg(long = "root")]
        roots: Vec<String>,
    },
    Tree {
        #[arg(long = "root")]
        roots: Vec<String>,
    },
    Load {
        root_path: String,
    },
    ListFiles {
        root_path: String,
    },
}

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let cli = Cli::parse();
    let service = SkillService::new();

    match cli.command {
        Command::Scan { roots } => print_json(service.scan(optional_roots(roots))?),
        Command::Tree { roots } => print_json(service.scan_tree(optional_roots(roots))?),
        Command::Load { root_path } => print_json(service.load_from_root(root_path)?),
        Command::ListFiles { root_path } => print_json(service.list_from_root(root_path)?),
    }
}

fn optional_roots(roots: Vec<String>) -> Option<Vec<String>> {
    if roots.is_empty() {
        None
    } else {
        Some(roots)
    }
}

fn print_json<T: Serialize>(value: T) -> Result<(), String> {
    let content = serde_json::to_string_pretty(&value)
        .map_err(|error| format!("Failed to serialize response: {error}"))?;
    println!("{content}");
    Ok(())
}
