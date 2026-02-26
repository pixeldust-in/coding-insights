import { join } from 'path';
import { homedir } from 'os';

export const CLAUDE_DIR = join(homedir(), '.claude');
export const PROJECTS_DIR = join(CLAUDE_DIR, 'projects');
export const COMMANDS_DIR = join(CLAUDE_DIR, 'commands');
export const SKILLS_DIR = join(CLAUDE_DIR, 'skills');
export const PLANS_DIR = join(CLAUDE_DIR, 'plans');
export const SESSION_META_DIR = join(CLAUDE_DIR, 'usage-data', 'session-meta');
export const SESSION_FACETS_DIR = join(CLAUDE_DIR, 'usage-data', 'facets');
export const STATS_CACHE_PATH = join(CLAUDE_DIR, 'stats-cache.json');
export const HISTORY_PATH = join(CLAUDE_DIR, 'history.jsonl');
export const SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json');
export const SETTINGS_LOCAL_PATH = join(CLAUDE_DIR, 'settings.local.json');
export const PLUGINS_PATH = join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
export const CLAUDE_MD_PATH = join(CLAUDE_DIR, 'CLAUDE.md');
export const AGENTS_DIR = join(CLAUDE_DIR, 'agents');
