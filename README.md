# Coding Insights

A local dashboard for visualizing your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [Codex CLI](https://github.com/openai/codex) usage data. Built with SvelteKit 2, Tailwind CSS 4, and Chart.js.

It reads directly from your `~/.claude/` and `~/.codex/` directories — no API keys, no external services, everything stays on your machine.

![Dashboard](https://img.shields.io/badge/SvelteKit-2-FF3E00?logo=svelte) ![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

### Dashboard (`/claude` and `/codex`)

- Summary cards — sessions, messages, tokens, active days
- Activity over time — line chart with week/month/year period toggle
- Token usage by model — stacked bar chart with input/output breakdown
- Project activity & token charts — stacked bars per project
- Tool usage — pie chart of function/tool call distribution
- Language distribution — pie chart of programming languages used
- Coding hours heatmap — activity by hour of day
- Live usage panel — real-time API usage via OAuth (Claude Code, macOS)
- Model usage table — detailed input, output, cache read, and cache write token counts

### Projects (`/claude/projects` and `/codex/projects`)

- All projects grouped by working directory with session counts
- Project detail page with 6 metric cards (sessions, messages, tokens, time spent, lines changed / tool calls, avg session)
- Drill into any session for full conversation replay

### Sessions (`/claude/sessions` and `/codex/sessions`)

- All sessions across projects with search, sort, and outcome badges
- Full conversation viewer with:
  - Syntax-highlighted code blocks (Shiki dual-theme)
  - Expandable tool call cards
  - GitHub-style diff view for file edits (Edit, Write, apply_patch)
  - Collapsible thinking/reasoning blocks
  - Image blocks
  - Token count badges per message

### History (`/claude/history` and `/codex/history`)

- Timestamped action timeline from `history.jsonl`

### Plans (`/claude/plans` and `/codex/plans`)

- Browse saved plans

### Skills (`/claude/skills` and `/codex/skills`)

- Browse installed skills with sub-documents and rendered markdown

### Commands (`/claude/commands` and `/codex/commands`)

- Browse custom slash commands with rendered markdown descriptions

### Help (`/claude/help` and `/codex/help`)

- Parsed CLI help text and documentation

### Settings (`/claude/settings` and `/codex/settings`)

- View configuration: permissions, plugins, general settings

### Global

- **Search** — Cmd/Ctrl+K search across sessions, commands, and projects
- **Dark/Light Mode** — full theme support with CSS custom properties
- **Collapsible Sidebar** — state persisted in localStorage
- **Responsive** — grid layouts adapt for mobile, tablet, and desktop

## Prerequisites

- **Node.js 18+**
- **Claude Code** and/or **Codex CLI** installed and used

### Data Sources

The dashboard reads from these paths:

**`~/.claude/`** (Claude Code)

| Path | Data |
|------|------|
| `projects/` | Project JSONL conversation files |
| `usage-data/session-meta/` | Session metadata (duration, tools, languages, tokens) |
| `usage-data/facets/` | Session quality facets (goals, outcomes) |
| `stats-cache.json` | Aggregated token/model usage stats |
| `history.jsonl` | Timestamped action timeline |
| `commands/` | Custom slash commands (markdown) |
| `skills/` | Installed skills (markdown + sub-docs) |
| `plans/` | Saved plans |
| `settings.json` / `settings.local.json` | Global and local settings |
| `plugins/installed_plugins.json` | Installed plugins |

**`~/.codex/`** (Codex CLI)

| Path | Data |
|------|------|
| `sessions/` | Session JSONL files (YYYY/MM/DD structure) |
| `history.jsonl` | Timestamped action timeline |
| `skills/` | Installed skills |
| `config.toml` | Configuration |
| `AGENTS.md` | Agent documentation |

## Setup

```bash
# Clone the repo
git clone git@github.com:pixeldust-in/coding-insights.git
cd coding-insights

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Production Build

```bash
npm run build
npm run preview   # preview at http://localhost:4173
```

Uses `@sveltejs/adapter-node` — the build output is a standalone Node server in `build/`.

```bash
node build
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | SvelteKit 2 / Svelte 5 (runes) |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js |
| Syntax Highlighting | Shiki (dual-theme: github-dark / github-light) |
| Markdown | marked (GFM) |
| Diff Rendering | GitHub-style unified diffs |
| Runtime | Node.js (adapter-node) |

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte              # Landing page (tool selector)
│   ├── claude/                    # Claude Code section
│   │   ├── +page.svelte          #   Dashboard with charts
│   │   ├── projects/             #   Projects list + detail + session viewer
│   │   ├── sessions/             #   All sessions list
│   │   ├── history/              #   Action timeline
│   │   ├── plans/                #   Plans browser
│   │   ├── skills/               #   Skills browser
│   │   ├── commands/             #   Slash commands viewer
│   │   ├── help/                 #   CLI documentation
│   │   └── settings/             #   Configuration viewer
│   ├── codex/                    # Codex CLI section (mirrors claude/)
│   │   ├── +page.svelte          #   Dashboard with charts
│   │   ├── projects/             #   Projects list + detail
│   │   ├── sessions/             #   Session viewer
│   │   ├── history/              #   Action timeline
│   │   └── ...                   #   Plans, skills, commands, help, settings
│   └── api/                      # API endpoints
│       ├── claude/               #   Usage, search, session messages, files
│       └── codex/                #   Session messages, search
├── lib/
│   ├── components/
│   │   ├── analytics/            # SummaryCard, ActivityChart, TokenChart,
│   │   │                         # ToolUsageChart, LanguageChart, HourHeatmap,
│   │   │                         # ProjectActivityChart, ProjectTokenChart, UsagePanel
│   │   ├── conversation/         # MessageThread, ToolCallCard, ThinkingBlock,
│   │   │                         # DiffView, ImageBlock, TokenBadge
│   │   ├── layout/               # Sidebar, Header, SearchModal, ThemeToggle
│   │   └── shared/               # Badge, Card, EmptyState, TerminalSearch,
│   │                             # TerminalSelect, CollapsibleSection, FileEditor
│   ├── server/
│   │   ├── readers/              # File readers for ~/.claude data sources
│   │   ├── parsers/              # JSONL parser, frontmatter, path codec
│   │   ├── codex/                # Codex-specific readers and parsers
│   │   │   ├── readers/          #   Session file discovery and loading
│   │   │   ├── parsers/          #   Codex JSONL parser (messages, tokens, tools)
│   │   │   └── config.ts         #   ~/.codex path constants
│   │   ├── config.ts             # ~/.claude path constants
│   │   ├── markdown.ts           # Shiki + marked rendering pipeline
│   │   └── types.ts              # TypeScript interfaces
│   └── utils/                    # Formatting helpers, chart theme, language map
└── app.css                       # Theme variables (dark/light) + prose styles
```

## License

MIT
