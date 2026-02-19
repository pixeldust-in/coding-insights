# CLAUDE.md

## Project Overview

Coding Insights is a local SvelteKit dashboard for visualizing Claude Code usage data from `~/.claude/`. It is read-only — it never modifies user data.

## Commands

```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Production build (adapter-node → build/)
npm run preview    # Preview production build (port 4173)
npm run check      # Type-check with svelte-check
```

## Architecture

- **SvelteKit 2** with **Svelte 5 runes** (`$props`, `$state`, `$derived`)
- **Tailwind CSS 4** with `@theme` directive for CSS custom properties
- **Server-side only data loading** — all `~/.claude/` file reads happen in `+page.server.ts` loaders via readers in `$lib/server/readers/`
- **No database, no API keys, no env vars** — everything reads from the local filesystem

## Key Conventions

### Theming

- CSS custom properties defined in `src/app.css` under `@theme` (dark default) and `html.light` (light overrides)
- Use theme variables (`var(--color-text)`, `var(--color-surface)`, etc.) — never hardcode colors
- Both dark and light mode must be tested when touching styles
- Shiki syntax highlighting uses dual-theme mode (`github-dark` + `github-light`) with CSS variable output — see `src/lib/server/markdown.ts`

### Components

- Components live in `src/lib/components/{analytics,conversation,layout,shared}/`
- Path alias: `$components` → `src/lib/components`, `$utils` → `src/lib/utils`
- Chart components use Chart.js directly with canvas refs (no wrapper library)

### Data Flow

- `src/lib/server/config.ts` — all `~/.claude/` path constants
- `src/lib/server/readers/` — one reader per data source (stats, sessions, commands, skills, etc.)
- `src/lib/server/parsers/` — JSONL parser, frontmatter parser, path codec
- `src/lib/server/types.ts` — all TypeScript interfaces for data shapes
- Data is loaded in `+page.server.ts` files and passed to pages via `data` prop

### Styling

- Use Tailwind utility classes; custom CSS goes in `src/app.css`
- Cards use `bg-surface border border-border-subtle rounded-xl p-5 card-elevated`
- Prose/markdown content uses the `.prose` class
- The `card-elevated` class gets light-mode box-shadow automatically

### File Naming

- Svelte components: PascalCase (`SummaryCard.svelte`)
- Server modules: kebab-case (`session-meta.ts`)
- Utility modules: kebab-case (`chart-theme.ts`)
