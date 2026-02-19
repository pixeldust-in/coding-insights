# Coding Insights

A local dashboard for visualizing your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) usage data. Built with SvelteKit 2, Tailwind CSS 4, and Chart.js.

It reads directly from your `~/.claude` directory — no API keys, no external services, everything stays on your machine.

![Dashboard](https://img.shields.io/badge/SvelteKit-2-FF3E00?logo=svelte) ![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js) ![License](https://img.shields.io/badge/License-MIT-blue)

## What It Shows

- **Dashboard** — Summary cards (sessions, messages, tokens, active days), activity chart, token usage by model, tool usage breakdown, language distribution, and coding hour heatmap
- **Projects** — All projects Claude Code has been used in, with session counts and last active dates. Drill into any project to see its sessions
- **Session Viewer** — Full conversation replay with syntax-highlighted code, tool calls, thinking blocks, and token badges
- **Commands** — Browse your custom Claude Code slash commands (`~/.claude/commands/`) with rendered markdown
- **Skills** — Browse your installed skills (`~/.claude/skills/`) with sub-documents
- **Settings** — View your Claude Code configuration: permissions, plugins, and general settings
- **Search** — Global search across sessions (Ctrl/Cmd + K)
- **Dark/Light Mode** — Theme toggle matching Claude.ai aesthetics

## Prerequisites

- **Node.js 18+**
- **Claude Code** installed and used (the dashboard reads from `~/.claude/`)

The dashboard reads these paths under `~/.claude/`:

| Path | Data |
|------|------|
| `usage-data/session-meta/` | Session metadata (duration, tools, languages, tokens) |
| `usage-data/facets/` | Session quality facets (goals, outcomes, satisfaction) |
| `projects/` | Project JSONL conversation files |
| `commands/` | Custom slash commands (markdown) |
| `skills/` | Installed skills (markdown + sub-docs) |
| `stats-cache.json` | Aggregated token/model usage stats |
| `settings.json` / `settings.local.json` | Global and local settings |
| `plugins/installed_plugins.json` | Installed plugins |

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
| Runtime | Node.js (adapter-node) |

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte              # Dashboard home
│   ├── projects/                  # Projects list + [project]/[session] drill-down
│   ├── commands/                  # Slash commands viewer
│   ├── skills/                    # Skills browser
│   ├── settings/                  # Settings viewer
│   └── api/                       # Search + session APIs
├── lib/
│   ├── components/
│   │   ├── analytics/             # Charts (Activity, Token, Tool, Language, Heatmap)
│   │   ├── conversation/          # Message thread, tool cards, thinking blocks
│   │   ├── layout/                # Sidebar, Header, SearchModal, ThemeToggle
│   │   └── shared/                # Badge, Card, EmptyState, etc.
│   ├── server/
│   │   ├── readers/               # File readers for each ~/.claude data source
│   │   ├── parsers/               # JSONL, frontmatter, path codec
│   │   ├── config.ts              # Path constants (~/.claude/*)
│   │   ├── markdown.ts            # Shiki + marked rendering pipeline
│   │   └── types.ts               # TypeScript interfaces
│   └── utils/                     # Formatting helpers, chart theme
└── app.css                        # Theme variables (dark/light) + prose styles
```

## License

MIT
