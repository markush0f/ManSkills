import type { IdeFile } from "./types";

export const initialFiles: IdeFile[] = [
  {
    id: "skill-orchestrator",
    path: "skills/agent-orchestrator/SKILL.md",
    language: "md",
    content: `# Agent Orchestrator

## Purpose
Coordinate multiple AI workers across research, planning, implementation, and verification.

## Activation
- Use when a task needs decomposition into smaller agents.
- Prefer one worker per clearly owned area.

## Workflow
1. Inspect the request and define the critical path.
2. Spawn only bounded subtasks with explicit ownership.
3. Integrate results into a single final response.

## Guardrails
- Do not duplicate work between agents.
- Do not spawn agents for blocking work you should do locally.
- Close idle agents when they are no longer needed.
`,
    savedContent: `# Agent Orchestrator

## Purpose
Coordinate multiple AI workers across research, planning, implementation, and verification.

## Activation
- Use when a task needs decomposition into smaller agents.
- Prefer one worker per clearly owned area.

## Workflow
1. Inspect the request and define the critical path.
2. Spawn only bounded subtasks with explicit ownership.
3. Integrate results into a single final response.

## Guardrails
- Do not duplicate work between agents.
- Do not spawn agents for blocking work you should do locally.
- Close idle agents when they are no longer needed.
`,
  },
  {
    id: "orchestrator-prompt",
    path: "skills/agent-orchestrator/prompt.md",
    language: "md",
    content: `# Prompt Template

You are responsible for coordinating AI workers.

Required output:
- task scope
- assigned ownership
- expected result
- merge considerations

Keep delegations concrete and disjoint.
`,
    savedContent: `# Prompt Template

You are responsible for coordinating AI workers.

Required output:
- task scope
- assigned ownership
- expected result
- merge considerations

Keep delegations concrete and disjoint.
`,
  },
  {
    id: "orchestrator-config",
    path: "skills/agent-orchestrator/config.json",
    language: "json",
    content: `{
  "name": "agent-orchestrator",
  "category": "coordination",
  "model": "gpt-5.4",
  "allowed_tools": ["spawn_agent", "send_input", "wait_agent"],
  "max_parallel_workers": 3
}
`,
    savedContent: `{
  "name": "agent-orchestrator",
  "category": "coordination",
  "model": "gpt-5.4",
  "allowed_tools": ["spawn_agent", "send_input", "wait_agent"],
  "max_parallel_workers": 3
}
`,
  },
  {
    id: "review-skill",
    path: "skills/code-review/SKILL.md",
    language: "md",
    content: `# Code Review Skill

## Purpose
Review changes with focus on bugs, regressions, risk, and missing coverage.

## Review priorities
1. Behavioural regressions
2. Data loss or corruption risk
3. Security issues
4. Test gaps

## Output format
- findings first
- open questions second
- summary last
`,
    savedContent: `# Code Review Skill

## Purpose
Review changes with focus on bugs, regressions, risk, and missing coverage.

## Review priorities
1. Behavioural regressions
2. Data loss or corruption risk
3. Security issues
4. Test gaps

## Output format
- findings first
- open questions second
- summary last
`,
  },
  {
    id: "review-rules",
    path: "skills/code-review/rules.json",
    language: "json",
    content: `{
  "severity_order": ["critical", "high", "medium", "low"],
  "require_file_references": true,
  "default_focus": ["bugs", "risks", "missing tests"],
  "allow_style_only_comments": false
}
`,
    savedContent: `{
  "severity_order": ["critical", "high", "medium", "low"],
  "require_file_references": true,
  "default_focus": ["bugs", "risks", "missing tests"],
  "allow_style_only_comments": false
}
`,
  },
  {
    id: "research-skill",
    path: "skills/research-assistant/SKILL.md",
    language: "md",
    content: `# Research Assistant

## Purpose
Gather primary-source information and produce concise, source-backed summaries.

## Requirements
- Prefer official docs, papers, and vendor references.
- Mark inferences clearly.
- Include links when sources are required.

## Avoid
- stale summaries without verification
- secondary-source dependency when primary docs exist
`,
    savedContent: `# Research Assistant

## Purpose
Gather primary-source information and produce concise, source-backed summaries.

## Requirements
- Prefer official docs, papers, and vendor references.
- Mark inferences clearly.
- Include links when sources are required.

## Avoid
- stale summaries without verification
- secondary-source dependency when primary docs exist
`,
  },
  {
    id: "research-sources",
    path: "skills/research-assistant/sources.json",
    language: "json",
    content: `{
  "allowed_domains": ["openai.com", "platform.openai.com", "docs.python.org"],
  "prefer_primary_sources": true,
  "require_dates_for_latest_queries": true
}
`,
    savedContent: `{
  "allowed_domains": ["openai.com", "platform.openai.com", "docs.python.org"],
  "prefer_primary_sources": true,
  "require_dates_for_latest_queries": true
}
`,
  },
  {
    id: "research-notes",
    path: "skills/research-assistant/notes.md",
    language: "md",
    content: `# Notes

- Latest-information requests must be verified before answering.
- Use exact dates when the user references relative time.
- Keep quotes short and link to sources.
`,
    savedContent: `# Notes

- Latest-information requests must be verified before answering.
- Use exact dates when the user references relative time.
- Keep quotes short and link to sources.
`,
  },
];

export const initialOpenFileIds = ["skill-orchestrator", "review-skill"];

export const blueprintItems = [
  "Skill manifests",
  "Prompt templates",
  "Runtime configuration",
  "Knowledge notes",
];
