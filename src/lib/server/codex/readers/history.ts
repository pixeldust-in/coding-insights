import { readFileSync, existsSync } from 'fs';
import { CODEX_HISTORY_PATH } from '../config.js';
import type { CodexHistoryEntry } from '../types.js';

export function readCodexHistory(): CodexHistoryEntry[] {
	if (!existsSync(CODEX_HISTORY_PATH)) return [];

	try {
		const raw = readFileSync(CODEX_HISTORY_PATH, 'utf-8');
		const entries: CodexHistoryEntry[] = [];

		for (const line of raw.split('\n')) {
			if (!line.trim()) continue;
			try {
				const parsed = JSON.parse(line) as CodexHistoryEntry;
				if (parsed.session_id && parsed.text) {
					entries.push(parsed);
				}
			} catch {
				continue;
			}
		}

		// Sort by timestamp descending
		entries.sort((a, b) => b.ts - a.ts);
		return entries;
	} catch {
		return [];
	}
}
