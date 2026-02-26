import { join } from 'path';
import { homedir } from 'os';

export const CODEX_DIR = join(homedir(), '.codex');
export const CODEX_SESSIONS_DIR = join(CODEX_DIR, 'sessions');
export const CODEX_HISTORY_PATH = join(CODEX_DIR, 'history.jsonl');
export const CODEX_CONFIG_PATH = join(CODEX_DIR, 'config.toml');
export const CODEX_SKILLS_DIR = join(CODEX_DIR, 'skills');
export const CODEX_AGENTS_MD_PATH = join(CODEX_DIR, 'AGENTS.md');
export const CODEX_RULES_DIR = join(CODEX_DIR, 'rules');
