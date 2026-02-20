import { readFileSync, existsSync } from 'fs';
import { HISTORY_PATH } from '../config.js';
import { getCached } from '../cache.js';
import type { HistoryEntry } from '../types.js';

export function readHistory(): HistoryEntry[] {
	if (!existsSync(HISTORY_PATH)) return [];

	return getCached(HISTORY_PATH, () => {
		try {
			const raw = readFileSync(HISTORY_PATH, 'utf-8');
			const entries: HistoryEntry[] = [];
			for (const line of raw.split('\n')) {
				if (!line.trim()) continue;
				try {
					const parsed = JSON.parse(line) as HistoryEntry;
					if (!parsed.display || !parsed.sessionId) continue;
					if (parsed.display.startsWith('/')) continue;
					entries.push(parsed);
				} catch {
					continue;
				}
			}
			entries.sort((a, b) => b.timestamp - a.timestamp);
			return entries;
		} catch {
			return [];
		}
	});
}
