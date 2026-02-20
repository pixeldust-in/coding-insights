import { readFileSync, existsSync } from 'fs';
import { CODEX_CONFIG_PATH } from '../config.js';
import { parseTOML } from '../parsers/toml.js';
import type { CodexConfig } from '../types.js';

export function readCodexConfig(): CodexConfig {
	if (!existsSync(CODEX_CONFIG_PATH)) return {};

	try {
		const raw = readFileSync(CODEX_CONFIG_PATH, 'utf-8');
		const parsed = parseTOML(raw);
		return parsed as unknown as CodexConfig;
	} catch {
		return {};
	}
}
